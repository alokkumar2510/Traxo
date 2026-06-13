import { createHash } from "crypto";
import { Timestamp } from "firebase/firestore";
import { Tracker, Snapshot, ScanRecord, TrackerEvent, NotificationLog } from "@/types/database";
import { fetchWithPlaywright } from "../scraping/browser";
import { normalizeText, extractVisibleBodyText, extractSection, extractPrice, extractJobs } from "../scraping/parser";
import { TrackerRepository } from "../firestore/trackers";
import { UserRepository } from "../firestore/users";
import { NotificationRepository } from "../firestore/notifications";
import { NotificationPipeline } from "../notifications/pipeline";
import { WebhookDispatcher } from "../notifications/webhooks";
import { uploadImageBuffer } from "../storage/client";
import { generateVisualDiff } from "./visual";
import { Screenshot } from "@/types/database";
import { logger } from "@/utils/logger";

/**
 * Computes SHA-256 hash of a string or buffer
 */
export function generateHash(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Calculates next scan date based on tracker frequency
 */
export function calculateNextScanAt(frequency: string): Date {
  const next = new Date();
  switch (frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "6h":
      next.setHours(next.getHours() + 6);
      break;
    case "12h":
      next.setHours(next.getHours() + 12);
      break;
    case "daily":
    default:
      next.setDate(next.getDate() + 1);
      break;
  }
  return next;
}

export interface ScanExecutionResult {
  success: boolean;
  changesDetected: boolean;
  error?: string;
  responseTime: number;
}

/**
 * Classifies event severity based on event type and price change magnitude
 */
function classifySeverity(
  eventType: string,
  oldPrice?: number,
  newPrice?: number
): "low" | "medium" | "high" {
  switch (eventType) {
    case "price_drop":
      if (oldPrice && newPrice) {
        const dropPct = ((oldPrice - newPrice) / oldPrice) * 100;
        return dropPct >= 20 ? "high" : dropPct >= 5 ? "medium" : "low";
      }
      return "medium";
    case "price_increase":
      return "medium";
    case "new_job":
      return "low";
    case "pdf_updated":
      return "medium";
    case "content_changed":
    case "content_added":
    case "content_removed":
    default:
      return "low";
  }
}

export class MonitoringEngine {
  /**
   * Executes a complete monitoring scan cycle for a single tracker
   */
  static async runScan(trackerId: string): Promise<ScanExecutionResult> {
    const startTime = Date.now();
    logger.info({
      service: "monitoring",
      event: "scan_run_started",
      trackerId,
    });

    // 1. Fetch tracker details from Firestore
    const tracker = await TrackerRepository.getTracker(trackerId);
    if (!tracker) {
      const errMsg = "Tracker document not found in database";
      logger.error({ service: "monitoring", event: "scan_run_failed", trackerId, error: errMsg });
      return { success: false, changesDetected: false, error: errMsg, responseTime: Date.now() - startTime };
    }

    if (tracker.status === "paused") {
      const errMsg = "Skipping scan. Tracker is paused.";
      logger.warn({ service: "monitoring", event: "scan_run_skipped", trackerId, metadata: { reason: errMsg } });
      return { success: false, changesDetected: false, error: errMsg, responseTime: Date.now() - startTime };
    }

    try {
      let contentToHash = "";
      let rawContent = "";
      let statusCode = 200;
      let diffSummary = "";
      let eventType = "content_changed";
      let eventTitle = "Tracker Updated";
      const eventMetadata: Record<string, any> = {};
      let screenshotBuffer: Buffer | undefined;

      const now = new Date();
      const currentTimestamp = Timestamp.fromDate(now);

      // 2. Fetch and extract data based on Tracker Type
      if (tracker.type === "pdf") {
        // PDF Tracking
        const res = await fetch(tracker.url);
        statusCode = res.status;
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF document. HTTP Status: ${res.status}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        
        contentToHash = generateHash(pdfBuffer);
        rawContent = `PDF File length: ${pdfBuffer.length} bytes`;
        diffSummary = "PDF file content was modified.";
        eventType = "pdf_updated";
        eventTitle = `PDF document updated: ${tracker.name}`;
      } else {
        // Web Page scraping (Website, Section, Price, Job)
        let html = "";
        
        // For static website and section, attempt lightweight standard fetch first
        if (tracker.type === "website" || tracker.type === "section") {
          try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
            const fetchRes = await fetch(tracker.url, {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            clearTimeout(id);
            statusCode = fetchRes.status;
            if (fetchRes.ok) {
              html = await fetchRes.text();
            }
          } catch (e) {
            logger.warn({
              service: "monitoring",
              event: "static_fetch_failed_falling_back_to_playwright",
              trackerId,
              error: e,
            });
          }
        }



        // Fallback to Playwright if static fetch fails, or for complex dynamic targets (Job/Price)
        if (!html) {
          const browserResult = await fetchWithPlaywright(tracker.url, { captureScreenshot: true });
          html = browserResult.html;
          statusCode = browserResult.status;
          screenshotBuffer = browserResult.screenshot;
        } else {
          // Statically loaded, but we run browser screenshot in background to support visual diff checks
          try {
            const browserResult = await fetchWithPlaywright(tracker.url, { captureScreenshot: true });
            screenshotBuffer = browserResult.screenshot;
          } catch (err) {
            logger.warn({
              service: "monitoring",
              event: "background_screenshot_failed",
              trackerId,
              error: err,
            });
          }
        }

        // Parse content according to configurations
        if (tracker.type === "section" && tracker.sectionConfig) {
          const extractedText = extractSection(html, tracker.sectionConfig.selector);
          rawContent = extractedText;
          contentToHash = generateHash(normalizeText(extractedText));
          diffSummary = "Monitored section content updated.";
          eventTitle = `Section updated: ${tracker.name}`;
        } else if (tracker.type === "price" && tracker.priceConfig) {
          const priceValue = extractPrice(html);

          if (priceValue === null) {
            throw new Error("Could not extract a numeric price from the webpage.");
          }

          contentToHash = generateHash(String(priceValue));
          rawContent = `Extracted price: ${tracker.priceConfig.currency} ${priceValue}`;

          const oldPrice = tracker.priceConfig.currentPrice;
          
          eventMetadata.currency = tracker.priceConfig.currency;
          eventMetadata.newPrice = priceValue;
          eventMetadata.oldPrice = oldPrice;

          if (oldPrice !== undefined) {
            if (priceValue < oldPrice) {
              eventType = "price_drop";
              eventTitle = `Price dropped for ${tracker.name}`;
              diffSummary = `Price decreased from ${tracker.priceConfig.currency} ${oldPrice} to ${tracker.priceConfig.currency} ${priceValue}`;
            } else if (priceValue > oldPrice) {
              eventType = "price_increase";
              eventTitle = `Price increased for ${tracker.name}`;
              diffSummary = `Price increased from ${tracker.priceConfig.currency} ${oldPrice} to ${tracker.priceConfig.currency} ${priceValue}`;
            }
          } else {
            diffSummary = `Initial price tracked: ${tracker.priceConfig.currency} ${priceValue}`;
          }

          // Update embedded price config in tracker
          const updatedPriceConfig = {
            ...tracker.priceConfig,
            currentPrice: priceValue,
            lowestPrice: tracker.priceConfig.lowestPrice !== undefined ? Math.min(tracker.priceConfig.lowestPrice, priceValue) : priceValue,
            highestPrice: tracker.priceConfig.highestPrice !== undefined ? Math.max(tracker.priceConfig.highestPrice, priceValue) : priceValue,
          };
          tracker.priceConfig = updatedPriceConfig;
        } else if (tracker.type === "job" && tracker.jobConfig) {
          const jobs = extractJobs(html, tracker.jobConfig.keywords, {
            location: tracker.jobConfig.location,
            remoteOnly: tracker.jobConfig.remoteOnly,
          });

          contentToHash = generateHash(JSON.stringify(jobs));
          rawContent = JSON.stringify(jobs);
          diffSummary = `Found ${jobs.length} matching job listings.`;
          eventType = "new_job";
          eventTitle = `New job postings found on ${tracker.name}`;
          eventMetadata.listingsCount = jobs.length;
          eventMetadata.listings = jobs.slice(0, 5); // Store top 5 job samples in metadata
        } else {
          // General Website tracking — use clean visible text (strips script nonces, CSS values etc)
          const bodyText = extractVisibleBodyText(html);
          contentToHash = generateHash(bodyText);
          rawContent = bodyText.slice(0, 5000); // cap snapshot storage
          diffSummary = "Webpage text content modified.";
          eventTitle = `Content updated: ${tracker.name}`;
        }
      }

      // 3. Compare current hash with latest snapshot
      const latestSnapshot = await TrackerRepository.getLatestSnapshot(trackerId);
      let changesDetected = false;

      if (!latestSnapshot) {
        // Initial run - Save snapshot but do NOT fire change events or notifications
        changesDetected = false;
        
        const snapshotId = crypto.randomUUID();
        const initialSnapshot: Snapshot = {
          id: snapshotId,
          trackerId,
          hash: contentToHash,
          content: rawContent,
          contentLength: rawContent.length,
          createdAt: currentTimestamp,
        };
        await TrackerRepository.saveSnapshot(trackerId, initialSnapshot);
        
        if (tracker.type === "pdf" && tracker.pdfConfig) {
          tracker.pdfConfig = { ...tracker.pdfConfig, lastHash: contentToHash, lastModified: currentTimestamp };
        }

        // Upload baseline screenshot on first run
        if (screenshotBuffer) {
          try {
            const fileName = `${now.getTime()}.png`;
            const screenshotPath = `screenshots/${trackerId}/${fileName}`;
            const screenshotUrl = await uploadImageBuffer(screenshotPath, screenshotBuffer);
            
            const screenshotRecord: Screenshot = {
              id: crypto.randomUUID(),
              imageUrl: screenshotUrl,
              storagePath: screenshotPath,
              width: 1280,
              height: 720,
              createdAt: currentTimestamp,
            };
            await TrackerRepository.saveScreenshotRecord(trackerId, screenshotRecord);
          } catch (err) {
            logger.error({
              service: "monitoring",
              event: "baseline_screenshot_failed",
              trackerId,
              error: err,
            });
          }
        }
      } else if (latestSnapshot.hash !== contentToHash) {
        changesDetected = true;
        
        // Save new Snapshot
        const snapshotId = crypto.randomUUID();
        const newSnapshot: Snapshot = {
          id: snapshotId,
          trackerId,
          hash: contentToHash,
          content: rawContent,
          contentLength: rawContent.length,
          createdAt: currentTimestamp,
        };
        await TrackerRepository.saveSnapshot(trackerId, newSnapshot);

        if (tracker.type === "pdf" && tracker.pdfConfig) {
          tracker.pdfConfig = { ...tracker.pdfConfig, lastHash: contentToHash, lastModified: currentTimestamp };
        }

        // Process visual comparison
        let screenshotUrl = "";
        let screenshotPath = "";
        if (screenshotBuffer) {
          try {
            const fileName = `${now.getTime()}.png`;
            screenshotPath = `screenshots/${trackerId}/${fileName}`;
            screenshotUrl = await uploadImageBuffer(screenshotPath, screenshotBuffer);

            const prevScreenshot = await TrackerRepository.getLatestScreenshotRecord(trackerId);
            if (prevScreenshot) {
              const prevRes = await fetch(prevScreenshot.imageUrl);
              if (prevRes.ok) {
                const prevBuffer = Buffer.from(await prevRes.arrayBuffer());
                const diffResult = generateVisualDiff(prevBuffer, screenshotBuffer);
                if (diffResult.changesDetected && diffResult.diffBuffer) {
                  const diffFileName = `${now.getTime()}_diff.png`;
                  const diffPath = `visual-diffs/${trackerId}/${diffFileName}`;
                  const diffImageUrl = await uploadImageBuffer(diffPath, diffResult.diffBuffer);
                  
                  eventMetadata.visualDiff = {
                    diffImageUrl,
                    mismatchPercentage: diffResult.mismatchPercentage,
                    diffPixels: diffResult.diffPixels,
                  };
                }
              }
            }

            const screenshotRecord: Screenshot = {
              id: crypto.randomUUID(),
              imageUrl: screenshotUrl,
              storagePath: screenshotPath,
              width: 1280,
              height: 720,
              createdAt: currentTimestamp,
            };
            await TrackerRepository.saveScreenshotRecord(trackerId, screenshotRecord);
          } catch (err) {
            logger.error({
              service: "monitoring",
              event: "visual_diff_processing_failed",
              trackerId,
              error: err,
            });
          }
        }

        // 4. Generate Change Event
        const eventId = crypto.randomUUID();
        const severity = classifySeverity(eventType, eventMetadata.oldPrice, eventMetadata.newPrice);
        const changeEvent: TrackerEvent = {
          id: eventId,
          trackerId,
          type: eventType as any,
          title: eventTitle,
          summary: diffSummary,
          severity,
          metadata: eventMetadata,
          createdAt: currentTimestamp,
        };
        await TrackerRepository.saveEvent(trackerId, changeEvent);

        // 5. Generate Notification Logs based on user preferences
        const preferences = await UserRepository.getUserPreferences(tracker.userId);
        if (preferences) {
          if (preferences.emailNotifications) {
            const emailNotif: NotificationLog = {
              id: crypto.randomUUID(),
              trackerId,
              eventId,
              channel: "email",
              status: "pending",
              read: false,
              createdAt: currentTimestamp,
            };
            await NotificationRepository.createNotification(tracker.userId, emailNotif);
          }

          if (preferences.telegramNotifications && preferences.telegramChatId) {
            const telegramNotif: NotificationLog = {
              id: crypto.randomUUID(),
              trackerId,
              eventId,
              channel: "telegram",
              status: "pending",
              read: false,
              createdAt: currentTimestamp,
            };
            await NotificationRepository.createNotification(tracker.userId, telegramNotif);
          }

          // Trigger the notification pipeline asynchronously
          NotificationPipeline.dispatchPendingNotifications(tracker.userId, eventId).catch((err) => {
            logger.error({
              service: "notification",
              event: "async_pipeline_trigger_failed",
              trackerId,
              error: err,
            });
          });

          // Trigger the webhooks pipeline asynchronously
          WebhookDispatcher.dispatchEvent(tracker.userId, changeEvent).catch((err) => {
            logger.error({
              service: "notification",
              event: "async_webhook_trigger_failed",
              trackerId,
              error: err,
            });
          });
        }
      }

      const responseTime = Date.now() - startTime;

      // 6. Save Scan Record
      const scanId = crypto.randomUUID();
      const scanRecord: ScanRecord = {
        id: scanId,
        status: "success",
        responseTime,
        statusCode,
        changesDetected,
        scannedAt: currentTimestamp,
      };
      await TrackerRepository.saveScanRecord(trackerId, scanRecord);

      // 7. Update Tracker scan states
      await TrackerRepository.updateTracker(trackerId, {
        status: "active",
        lastScanAt: currentTimestamp,
        nextScanAt: Timestamp.fromDate(calculateNextScanAt(tracker.frequency)),
        changeCount: tracker.changeCount + (changesDetected ? 1 : 0),
        priceConfig: tracker.priceConfig,
        pdfConfig: tracker.pdfConfig,
      });

      logger.info({
        service: "monitoring",
        event: "scan_run_success",
        trackerId,
        metadata: { changesDetected, responseTime },
      });

      return { success: true, changesDetected, responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMsg = error.message || String(error);

      logger.error({
        service: "monitoring",
        event: "scan_run_exception",
        trackerId,
        error: errorMsg,
      });

      // Save failed Scan Record
      const scanId = crypto.randomUUID();
      const failedScanRecord: ScanRecord = {
        id: scanId,
        status: "failed",
        responseTime,
        error: errorMsg,
        changesDetected: false,
        scannedAt: Timestamp.fromDate(new Date()),
      };
      await TrackerRepository.saveScanRecord(trackerId, failedScanRecord);

      // Update tracker status to error
      await TrackerRepository.updateTracker(trackerId, {
        status: "error",
        lastScanAt: Timestamp.fromDate(new Date()),
        nextScanAt: Timestamp.fromDate(calculateNextScanAt(tracker.frequency)),
      });

      return { success: false, changesDetected: false, error: errorMsg, responseTime };
    }
  }
}
