import { db } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { TrackerEvent } from "@/types/database";
import { logger } from "@/utils/logger";

interface Webhook {
  id: string;
  url: string;
  platform: "discord" | "slack" | "custom";
  events: string[];
  active: boolean;
}

export class WebhookDispatcher {
  /**
   * Dispatches a change event to all registered webhooks for a user with retry logic
   */
  static async dispatchEvent(userId: string, event: TrackerEvent): Promise<void> {
    try {
      const webhooksRef = collection(db, "users", userId, "webhooks");
      const q = query(webhooksRef, where("active", "==", true));
      const snap = await getDocs(q);

      if (snap.empty) return;

      const webhooks = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Webhook);

      // Filter webhooks subscribed to this event type
      const targetWebhooks = webhooks.filter((w) => w.events.includes(event.type));

      if (targetWebhooks.length === 0) return;

      logger.info({
        service: "notification",
        event: "webhooks_dispatch_started",
        userId,
        metadata: { eventId: event.id, count: targetWebhooks.length },
      });

      // Dispatch to all webhooks in parallel
      await Promise.all(
        targetWebhooks.map((w) =>
          this.sendWithRetry(w, event).catch((err) => {
            logger.error({
              service: "notification",
              event: "webhook_dispatch_failed_permanently",
              userId,
              metadata: { webhookId: w.id, url: w.url },
              error: err.message || err,
            });
          })
        )
      );
    } catch (error: any) {
      logger.error({
        service: "notification",
        event: "webhooks_query_failed",
        userId,
        error: error.message || error,
      });
    }
  }

  /**
   * Sends POST request with 3-stage backoff retry logic
   */
  private static async sendWithRetry(
    webhook: Webhook,
    event: TrackerEvent,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<void> {
    const payload = this.formatPayload(webhook.platform, event);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Traxo-Webhook-Dispatcher/1.0",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          logger.info({
            service: "notification",
            event: "webhook_dispatch_success",
            metadata: { webhookId: webhook.id, attempt },
          });
          return; // Success!
        }

        throw new Error(`HTTP Error Status: ${res.status}`);
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error; // Propagate exception to final logger
        }
        
        // Wait with exponential backoff
        const backoffTime = delayMs * Math.pow(2, attempt - 1);
        logger.warn({
          service: "notification",
          event: "webhook_dispatch_retry",
          metadata: { webhookId: webhook.id, attempt, backoffTimeMs: backoffTime },
        });
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }

  /**
   * Formats event payloads based on platform integrations (Slack blocks, Discord embeds, Custom JSON)
   */
  private static formatPayload(platform: "discord" | "slack" | "custom", event: TrackerEvent): any {
    const timeStr = event.createdAt?.toDate?.()?.toLocaleString() ?? new Date().toLocaleString();

    switch (platform) {
      case "slack":
        return {
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🔔 Traxo Alert: ${event.title}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Change Summary:*\n${event.summary}\n\n*Severity:* \`${event.severity.toUpperCase()}\`\n*Timestamp:* _${timeStr}_`,
              },
            },
          ],
        };

      case "discord":
        return {
          username: "Traxo Bot",
          embeds: [
            {
              title: `🔔 Traxo Alert: ${event.title}`,
              description: event.summary,
              color: event.severity === "high" ? 15539236 : 3892415, // red vs blue
              fields: [
                { name: "Severity", value: event.severity.toUpperCase(), inline: true },
                { name: "Timestamp", value: timeStr, inline: true },
              ],
            },
          ],
        };

      case "custom":
      default:
        return {
          event: "tracker.change",
          eventId: event.id,
          trackerId: event.trackerId,
          type: event.type,
          title: event.title,
          summary: event.summary,
          severity: event.severity,
          timestamp: timeStr,
          rawMetadata: event.metadata,
        };
    }
  }
}
