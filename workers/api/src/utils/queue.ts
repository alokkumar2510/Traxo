import { Bindings } from "../types";
import { runScanInWorker } from "./scanner";
import { getFirebaseIdToken } from "./auth";

/**
 * Executes the scan job entirely inside the Cloudflare Worker.
 * Previously called the Next.js /api/scan endpoint, which doesn't work
 * in a static export on Cloudflare Pages.
 */
export async function processScanJob(
  trackerId: string,
  userId: string,
  env: Bindings,
  attempts: number
): Promise<void> {
  console.log(`[Queue Consumer] Processing scan for tracker ${trackerId} (Attempt ${attempts})`);

  const result = await runScanInWorker(trackerId, env);

  if (!result.success && result.error) {
    throw new Error(`Scan failed: ${result.error}`);
  }

  console.log(
    `[Queue Consumer] Scan complete for tracker ${trackerId}. Changes detected: ${result.changesDetected}`
  );
}

/**
 * Calculates Cloudflare Queues custom retry delay in seconds.
 * - Attempt 2: 1 min
 * - Attempt 3: 5 min
 * - Attempt 4: 15 min
 */
export function calculateRetryDelay(attempts: number): number {
  switch (attempts) {
    case 1: return 60;
    case 2: return 300;
    case 3: return 900;
    default: return 900;
  }
}

/**
 * Logs a final failure when all queue retries are exhausted.
 */
export async function handleFailedJob(
  trackerId: string,
  userId: string,
  env: Bindings,
  error: any
): Promise<void> {
  const errorMsg = error?.message || String(error);
  console.error(
    `[Queue Consumer] [Max Retries Exhausted] Tracker: ${trackerId}, User: ${userId}. Error: ${errorMsg}`
  );

  // Write final error state directly to Firestore REST API
  try {
    const now = new Date().toISOString();
    const scanId = crypto.randomUUID();
    const body = {
      fields: {
        status: { stringValue: "failed" },
        responseTime: { integerValue: "0" },
        error: { stringValue: `Max retries exhausted. Last error: ${errorMsg}` },
        changesDetected: { booleanValue: false },
        scannedAt: { timestampValue: now },
      },
    };

    const idToken = await getFirebaseIdToken(env);
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/trackers/${trackerId}/scans?documentId=${scanId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    // Update tracker status to error
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/trackers/${trackerId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            status: { stringValue: "error" },
            updatedAt: { timestampValue: now },
          },
        }),
      }
    );
  } catch (writeErr) {
    console.error("[Queue Consumer] Failed to write final error record to Firestore:", writeErr);
  }
}
