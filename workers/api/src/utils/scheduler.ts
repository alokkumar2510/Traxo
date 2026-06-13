import { Bindings } from "../types";

/**
 * Maps a Cloudflare Scheduled Event cron expression to our database frequency field value
 */
export function mapCronToFrequency(cron: string): string | null {
  switch (cron) {
    case "*/30 * * * *":
      return "30m";
    case "0 * * * *":
      return "hourly";
    case "0 */3 * * *":
      return "3h";
    case "0 */6 * * *":
      return "6h";
    case "0 */12 * * *":
      return "12h";
    case "0 0 * * *":
      return "daily";
    default:
      return null;
  }
}

/**
 * Handles incoming Cloudflare Cron Trigger events
 */
export async function handleCronTrigger(
  cronExpression: string,
  env: Bindings
): Promise<void> {
  const frequency = mapCronToFrequency(cronExpression);
  if (!frequency) {
    console.warn(`[Scheduler] Skipping. Unsupported cron trigger: ${cronExpression}`);
    return;
  }

  console.log(`[Scheduler] Running cron execution for frequency: ${frequency} (Cron: ${cronExpression})`);

  // 1. Query active trackers matching target frequency from Next.js API
  const scheduleUrl = `${env.NEXT_JS_API_URL}/api/scan/schedule`;
  
  try {
    const res = await fetch(scheduleUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.INTERNAL_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frequency }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to query schedule from Next.js API: ${res.status}. Body: ${errBody}`);
    }

    const { trackers } = (await res.json()) as { trackers: Array<{ id: string; userId: string }> };

    if (!trackers || trackers.length === 0) {
      console.log(`[Scheduler] No active trackers found for frequency: ${frequency}`);
      return;
    }

    console.log(`[Scheduler] Found ${trackers.length} active trackers for frequency: ${frequency}`);

    // 2. Dispatch each tracker scan job to Cloudflare Queue using batching
    if (env.SCANS_QUEUE) {
      let dispatched = 0;
      const chunkSize = 100;
      for (let i = 0; i < trackers.length; i += chunkSize) {
        const chunk = trackers.slice(i, i + chunkSize).map((tracker) => ({
          body: {
            trackerId: tracker.id,
            userId: tracker.userId,
          },
        }));
        await env.SCANS_QUEUE.sendBatch(chunk);
        dispatched += chunk.length;
      }
      console.log(`[Scheduler] Successfully dispatched ${dispatched} scan jobs to queue.`);
    } else {
      console.warn("[Scheduler] SCANS_QUEUE is not bound. Skipping queue dispatch.");
    }
  } catch (error: any) {
    console.error(`[Scheduler] Error running cron scheduler for ${frequency}:`, error.message || error);
    throw error;
  }
}
