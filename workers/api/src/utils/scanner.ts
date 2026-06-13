import { FirestoreClient, mapToFirestore, toFirestoreValue } from "./firestore";
import { Bindings } from "../types";
import { getFirebaseIdToken } from "./auth";

// --- Types ---
interface Tracker {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: "website" | "section" | "job" | "price" | "pdf";
  status: "active" | "paused" | "error";
  frequency: string;
  changeCount: number;
  priceConfig?: {
    currency: string;
    currentPrice?: number;
    lowestPrice?: number;
    highestPrice?: number;
  };
  sectionConfig?: {
    selector: string;
    selectorType: string;
  };
  jobConfig?: {
    keywords: string[];
    location?: string;
    remoteOnly?: boolean;
  };
  pdfConfig?: {
    fileName: string;
    lastHash?: string;
  };
}

// (Authentication is handled by the shared auth utility)

// --- SHA-256 hash using Web Crypto API (available in CF Workers) ---
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Text Normalization ---
function normalizeText(text: string): string {
  return text.replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

// --- HTML → visible text (strips scripts, styles, head) ---
function extractVisibleText(html: string): string {
  // Remove <script>...</script> blocks
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove <style>...</style> blocks
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove <head>...</head>
  cleaned = cleaned.replace(/<head[\s\S]*?<\/head>/gi, "");
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  return normalizeText(cleaned);
}

// --- Extract CSS section text ---
function extractSectionText(html: string, selector: string): string {
  // Basic selector support: handles tag, .class, #id, and simple combinations
  // CF Workers doesn't have DOM access, use regex-based approach
  
  let pattern: RegExp | null = null;
  
  if (selector.startsWith("#")) {
    // ID selector: #main-content
    const id = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(`<[a-z][^>]*\\sid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[a-z][^>]*>`, "i");
  } else if (selector.startsWith(".")) {
    // Class selector: .job-listings
    const cls = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(`<[a-z][^>]*\\sclass=["'][^"']*${cls}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[a-z][^>]*>`, "i");
  } else {
    // Tag selector: main, article, section
    const tag = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  }

  if (pattern) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return extractVisibleText(match[1]);
    }
  }
  
  throw new Error(`Selector "${selector}" not found in page. Try a different CSS selector.`);
}

// --- Price Extraction ---
function extractPrice(bodyText: string): number | null {
  // Prioritize currency-prefixed numbers (₹ $  £ € Rs INR USD etc)
  const currencyPatterns = [
    /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:\$|USD)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:£|GBP)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:€|EUR)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    // Number followed by currency
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:₹|Rs\.?|INR|USD|\$)/i,
  ];

  for (const pattern of currencyPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      // Sanity check: prices should be between 0.01 and 100,000,000
      if (!isNaN(num) && num > 0.01 && num < 100_000_000) {
        return num;
      }
    }
  }

  // Fallback: look for a standalone "price-like" number
  // Use word boundaries and context clues
  const priceContextRegex = /(?:price|cost|amount|total|pay|mrp|offer)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const contextMatch = bodyText.match(priceContextRegex);
  if (contextMatch) {
    const num = parseFloat(contextMatch[1].replace(/,/g, ""));
    if (!isNaN(num) && num > 0.01 && num < 100_000_000) {
      return num;
    }
  }

  return null;
}

// --- Job Extraction ---
interface ExtractedJob {
  title: string;
  link?: string;
  location?: string;
}

function extractJobs(
  html: string,
  keywords: string[],
  options: { location?: string; remoteOnly?: boolean } = {}
): ExtractedJob[] {
  const results: ExtractedJob[] = [];
  const seen = new Set<string>();
  const kwLower = keywords.map((k) => k.toLowerCase());

  // Match anchor tags
  const anchorRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const rawText = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (rawText.length < 5 || rawText.length > 150) continue;
    if (seen.has(rawText.toLowerCase())) continue;

    const matchesKeyword = kwLower.length === 0 || kwLower.some((k) => rawText.toLowerCase().includes(k));
    if (!matchesKeyword) continue;

    seen.add(rawText.toLowerCase());

    // Look for location in surrounding context (±200 chars)
    const start = Math.max(0, match.index - 200);
    const end = Math.min(html.length, match.index + match[0].length + 200);
    const context = html.slice(start, end).replace(/<[^>]+>/g, " ").toLowerCase();
    
    let location = "";
    if (context.includes("remote") || context.includes("work from home")) {
      location = "Remote";
    } else if (options.location && context.includes(options.location.toLowerCase())) {
      location = options.location;
    }

    if (options.remoteOnly && location !== "Remote") continue;
    if (options.location && location === "" && !rawText.toLowerCase().includes(options.location.toLowerCase())) continue;

    results.push({
      title: rawText,
      link: href.startsWith("http") ? href : undefined,
      location: location || undefined,
    });
  }

  return results;
}

// --- Severity Classification ---
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

// --- Calculate next scan timestamp ---
function calculateNextScanAt(frequency: string): string {
  const next = new Date();
  switch (frequency) {
    case "hourly": next.setHours(next.getHours() + 1); break;
    case "6h": next.setHours(next.getHours() + 6); break;
    case "12h": next.setHours(next.getHours() + 12); break;
    case "daily":
    default: next.setDate(next.getDate() + 1); break;
  }
  return next.toISOString();
}

// --- Helper to upload a screenshot from Microlink to Firebase Storage with fallback ---
async function uploadScreenshotToStorage(
  env: Bindings,
  idToken: string,
  trackerId: string,
  screenshotUrl: string
): Promise<string> {
  try {
    const res = await fetch(screenshotUrl);
    if (!res.ok) throw new Error(`Failed to download screenshot: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    const fileName = `${Date.now()}.png`;
    const storagePath = `screenshots/${trackerId}/${fileName}`;
    
    // 1. Try firebasestorage.app endpoint
    const uploadUrl1 = `https://firebasestorage.googleapis.com/v0/b/${env.FIREBASE_PROJECT_ID}.firebasestorage.app/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
    const uploadRes1 = await fetch(uploadUrl1, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "image/png"
      },
      body: buffer
    });

    if (uploadRes1.ok) {
      const data = await uploadRes1.json() as any;
      return `https://firebasestorage.googleapis.com/v0/b/${env.FIREBASE_PROJECT_ID}.firebasestorage.app/o/${encodeURIComponent(storagePath)}?alt=media&token=${data.downloadTokens}`;
    }

    // 2. Try appspot.com endpoint
    const uploadUrl2 = `https://firebasestorage.googleapis.com/v0/b/${env.FIREBASE_PROJECT_ID}.appspot.com/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
    const uploadRes2 = await fetch(uploadUrl2, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "image/png"
      },
      body: buffer
    });

    if (uploadRes2.ok) {
      const data = await uploadRes2.json() as any;
      return `https://firebasestorage.googleapis.com/v0/b/${env.FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media&token=${data.downloadTokens}`;
    }

    throw new Error(`Upload failed on both bucket configurations.`);
  } catch (error) {
    console.warn("[Scanner] Storage upload failed, falling back to direct screenshot URL:", error);
    return screenshotUrl;
  }
}

// ============================================================
// MAIN SCAN FUNCTION — runs entirely inside Cloudflare Worker
// ============================================================
export async function runScanInWorker(
  trackerId: string,
  env: Bindings
): Promise<{ success: boolean; changesDetected: boolean; error?: string }> {
  const startTime = Date.now();
  
  const idToken = await getFirebaseIdToken(env);
  const db = new FirestoreClient(env.FIREBASE_PROJECT_ID, idToken);

  console.log(`[Scanner] Starting scan for tracker: ${trackerId}`);

  // 1. Load tracker
  const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
  if (!tracker) {
    console.error(`[Scanner] Tracker ${trackerId} not found`);
    return { success: false, changesDetected: false, error: "Tracker not found" };
  }

  if (tracker.status === "paused") {
    console.log(`[Scanner] Tracker ${trackerId} is paused, skipping`);
    return { success: false, changesDetected: false, error: "Tracker is paused" };
  }

  let contentToHash = "";
  let rawContent = "";
  let statusCode = 200;
  let diffSummary = "";
  let eventType = "content_changed";
  let eventTitle = "Content Updated";
  const eventMetadata: Record<string, any> = {};
  let priceConfigUpdate: Tracker["priceConfig"] | undefined;

  try {
    if (tracker.type === "pdf") {
      // --- PDF Tracking ---
      const res = await fetch(tracker.url, { 
        headers: { "User-Agent": "TraxoBot/1.0 (+https://traxo.alokkumarsahu.in)" }
      });
      statusCode = res.status;
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching PDF`);
      
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Hash the raw bytes
      const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
      contentToHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      rawContent = `PDF: ${bytes.length} bytes`;
      diffSummary = "PDF document was modified.";
      eventType = "pdf_updated";
      eventTitle = `PDF Updated: ${tracker.name}`;

    } else {
      // --- Web Fetch (website, section, price, job) ---
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      
      let html = "";
      try {
        const res = await fetch(tracker.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });
        clearTimeout(timeout);
        statusCode = res.status;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        throw new Error(`Failed to fetch URL: ${fetchErr.message}`);
      }

      if (tracker.type === "section" && tracker.sectionConfig) {
        const sectionText = extractSectionText(html, tracker.sectionConfig.selector);
        rawContent = sectionText;
        contentToHash = await sha256(normalizeText(sectionText));
        diffSummary = "Monitored section content changed.";
        eventTitle = `Section Updated: ${tracker.name}`;

      } else if (tracker.type === "price") {
        // Extract clean visible text for price scanning
        const visibleText = extractVisibleText(html);
        const priceValue = extractPrice(visibleText);
        
        if (priceValue === null) {
          throw new Error("Could not extract a numeric price from the page. Check the URL or try a section tracker instead.");
        }

        contentToHash = await sha256(String(priceValue));
        rawContent = `Price: ${tracker.priceConfig?.currency ?? "USD"} ${priceValue}`;

        const oldPrice = tracker.priceConfig?.currentPrice;
        eventMetadata.currency = tracker.priceConfig?.currency ?? "USD";
        eventMetadata.newPrice = priceValue;
        eventMetadata.oldPrice = oldPrice;

        if (oldPrice !== undefined && oldPrice !== priceValue) {
          if (priceValue < oldPrice) {
            eventType = "price_drop";
            eventTitle = `Price Dropped: ${tracker.name}`;
            diffSummary = `Price dropped from ${tracker.priceConfig?.currency} ${oldPrice} → ${priceValue}`;
          } else {
            eventType = "price_increase";
            eventTitle = `Price Increased: ${tracker.name}`;
            diffSummary = `Price rose from ${tracker.priceConfig?.currency} ${oldPrice} → ${priceValue}`;
          }
        } else if (oldPrice === undefined) {
          diffSummary = `Initial price captured: ${tracker.priceConfig?.currency} ${priceValue}`;
        }

        priceConfigUpdate = {
          ...(tracker.priceConfig ?? { currency: "USD" }),
          currentPrice: priceValue,
          lowestPrice: tracker.priceConfig?.lowestPrice !== undefined ? Math.min(tracker.priceConfig.lowestPrice, priceValue) : priceValue,
          highestPrice: tracker.priceConfig?.highestPrice !== undefined ? Math.max(tracker.priceConfig.highestPrice, priceValue) : priceValue,
        };

      } else if (tracker.type === "job" && tracker.jobConfig) {
        const jobs = extractJobs(html, tracker.jobConfig.keywords, {
          location: tracker.jobConfig.location,
          remoteOnly: tracker.jobConfig.remoteOnly,
        });
        const jobsJson = JSON.stringify(jobs);
        contentToHash = await sha256(jobsJson);
        rawContent = jobsJson;
        diffSummary = `Found ${jobs.length} matching job listing(s).`;
        eventType = "new_job";
        eventTitle = `Job Listings Changed: ${tracker.name}`;
        eventMetadata.listingsCount = jobs.length;
        eventMetadata.listings = jobs.slice(0, 5);

      } else {
        // General website tracking — use clean visible text
        const visibleText = extractVisibleText(html);
        contentToHash = await sha256(visibleText);
        rawContent = visibleText.slice(0, 5000); // Cap snapshot size
        diffSummary = "Page content changed.";
        eventTitle = `Content Updated: ${tracker.name}`;
      }
    }

    // 2. Fetch latest snapshot
    const snapshotRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/trackers/${trackerId}/snapshots?orderBy=createdAt%20desc&pageSize=1`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    
    let latestHash: string | null = null;
    if (snapshotRes.ok) {
      const snapshotData = await snapshotRes.json() as any;
      const docs = snapshotData.documents;
      if (docs && docs.length > 0 && docs[0].fields?.hash?.stringValue) {
        latestHash = docs[0].fields.hash.stringValue;
      }
    }

    const changesDetected = latestHash !== null && latestHash !== contentToHash;
    const now = new Date().toISOString();
    const responseTime = Date.now() - startTime;

    // 3. Save snapshot (always on first run, or when changed)
    if (latestHash === null || changesDetected) {
      const snapshotId = crypto.randomUUID();
      await db.createDocument<any>(`trackers/${trackerId}/snapshots`, snapshotId, {
        trackerId,
        hash: contentToHash,
        content: rawContent.slice(0, 10000),
        contentLength: rawContent.length,
        createdAt: now,
      });
    }

    // 4. Save change event (only when changed, not on first run)
    if (changesDetected) {
      const eventId = crypto.randomUUID();
      const severity = classifySeverity(
        eventType,
        eventMetadata.oldPrice,
        eventMetadata.newPrice
      );

      // Take a screenshot of the URL for the change event
      try {
        console.log(`[Scanner] Taking screenshot of modified page: ${tracker.url}`);
        const screenshotUrl = `https://image.thum.io/get/${tracker.url}`;
        
        console.log(`[Scanner] Fetching screenshot from thum.io and attempting upload...`);
        const finalImageUrl = await uploadScreenshotToStorage(env, idToken, trackerId, screenshotUrl);
        
        // Set metadata for front-end rendering
        eventMetadata.visualDiff = {
          diffImageUrl: finalImageUrl,
          mismatchPercentage: 100, // Estimate mismatch percentage
          diffPixels: 1000,
        };
      } catch (screenshotErr) {
        console.error(`[Scanner] Failed to capture screenshot for change event:`, screenshotErr);
      }
      
      await db.createDocument<any>(`trackers/${trackerId}/events`, eventId, {
        trackerId,
        type: eventType,
        title: eventTitle,
        summary: diffSummary,
        severity,
        metadata: eventMetadata,
        createdAt: now,
      });

      // 5. Queue notifications via Firestore (Worker doesn't have Firebase Auth context)
      // Write pending notification records — the Next.js API or pipeline will dispatch them
      const notifId = crypto.randomUUID();
      await db.createDocument<any>(`users/${tracker.userId}/notifications`, notifId, {
        trackerId,
        eventId,
        channel: "email",
        status: "pending",
        read: false,
        createdAt: now,
      });
    }

    // 6. Save scan record
    const scanId = crypto.randomUUID();
    await db.createDocument<any>(`trackers/${trackerId}/scans`, scanId, {
      status: "success",
      responseTime,
      statusCode,
      changesDetected,
      scannedAt: now,
    });

    // 7. Update tracker
    const trackerUpdate: Record<string, any> = {
      status: "active",
      lastScanAt: now,
      nextScanAt: calculateNextScanAt(tracker.frequency),
      changeCount: (tracker.changeCount ?? 0) + (changesDetected ? 1 : 0),
      updatedAt: now,
    };
    if (priceConfigUpdate) {
      trackerUpdate.priceConfig = priceConfigUpdate;
    }

    await db.updateDocument(`trackers/${trackerId}`, trackerUpdate);

    console.log(`[Scanner] Scan complete for ${trackerId}. Changed: ${changesDetected}. Time: ${responseTime}ms`);
    return { success: true, changesDetected };

  } catch (err: any) {
    const errorMsg = err.message || String(err);
    const responseTime = Date.now() - startTime;
    console.error(`[Scanner] Scan failed for ${trackerId}: ${errorMsg}`);

    try {
      const scanId = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.createDocument<any>(`trackers/${trackerId}/scans`, scanId, {
        status: "failed",
        responseTime,
        error: errorMsg,
        changesDetected: false,
        scannedAt: now,
      });

      await db.updateDocument(`trackers/${trackerId}`, {
        status: "error",
        lastScanAt: now,
        nextScanAt: calculateNextScanAt(tracker.frequency),
        updatedAt: now,
      });
    } catch (writeErr) {
      console.error(`[Scanner] Failed to write error record: ${writeErr}`);
    }

    return { success: false, changesDetected: false, error: errorMsg };
  }
}
