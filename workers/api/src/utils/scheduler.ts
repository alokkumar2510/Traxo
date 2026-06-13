import { Bindings } from "../types";
import { getFirebaseIdToken } from "./auth";

/**
 * Maps a Cloudflare Scheduled Event cron expression to our database frequency field value.
 * Only maps crons that correspond to valid database ScanFrequency values.
 */
export function mapCronToFrequency(cron: string): string | null {
  switch (cron) {
    case "0 * * * *":    return "hourly";
    case "0 */6 * * *":  return "6h";
    case "0 */12 * * *": return "12h";
    case "0 0 * * *":    return "daily";
    default:             return null; // Unknown or unsupported cron
  }
}

/**
 * Handles incoming Cloudflare Cron Trigger events.
 * Queries Firestore directly (no Next.js API call) for active trackers
 * matching the target frequency, then dispatches scan jobs to the queue.
 */
export async function handleCronTrigger(
  cronExpression: string,
  env: Bindings
): Promise<void> {
  const frequency = mapCronToFrequency(cronExpression);
  if (!frequency) {
    console.warn(`[Scheduler] Unsupported cron expression, skipping: "${cronExpression}"`);
    return;
  }

  console.log(`[Scheduler] Cron triggered for frequency: ${frequency} (${cronExpression})`);

  // Query active trackers with this frequency directly from Firestore REST API
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "trackers" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "status" },
                  op: "EQUAL",
                  value: { stringValue: "active" },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "frequency" },
                  op: "EQUAL",
                  value: { stringValue: frequency },
                },
              },
            ],
          },
        },
        select: {
          fields: [
            { fieldPath: "userId" },
          ],
        },
      },
    };

    const idToken = await getFirebaseIdToken(env);
    const res = await fetch(firestoreUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore query failed (${res.status}): ${errBody}`);
    }

    const results = (await res.json()) as any[];
    const trackers: Array<{ id: string; userId: string }> = [];

    for (const item of results) {
      if (item.document) {
        const docName: string = item.document.name;
        const id = docName.split("/").pop() || "";
        const userId = item.document.fields?.userId?.stringValue || "";
        if (id && userId) {
          trackers.push({ id, userId });
        }
      }
    }

    if (trackers.length === 0) {
      console.log(`[Scheduler] No active trackers found for frequency: ${frequency}`);
      return;
    }

    console.log(`[Scheduler] Found ${trackers.length} active trackers for frequency: ${frequency}`);

    // Dispatch scan jobs to Cloudflare Queue in batches of 100
    if (env.SCANS_QUEUE) {
      const chunkSize = 100;
      let dispatched = 0;
      for (let i = 0; i < trackers.length; i += chunkSize) {
        const chunk = trackers.slice(i, i + chunkSize).map((t) => ({
          body: { trackerId: t.id, userId: t.userId },
        }));
        await env.SCANS_QUEUE.sendBatch(chunk);
        dispatched += chunk.length;
      }
      console.log(`[Scheduler] Dispatched ${dispatched} scan jobs to queue for frequency: ${frequency}`);
    } else {
      console.warn("[Scheduler] SCANS_QUEUE is not bound. Cannot dispatch jobs.");
    }
  } catch (error: any) {
    console.error(`[Scheduler] Error for frequency ${frequency}:`, error.message || error);
    throw error;
  }
}
