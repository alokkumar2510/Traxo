import { Bindings } from "../types";

/**
 * Executes the website scan job by calling the Next.js backend API
 */
export async function processScanJob(
  trackerId: string,
  userId: string,
  env: Bindings,
  attempts: number
): Promise<void> {
  console.log(`[Queue Consumer] Processing scan for tracker ${trackerId} (Attempt ${attempts})`);

  const url = `${env.NEXT_JS_API_URL}/api/scan`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.INTERNAL_API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trackerId }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Next.js API scan failed with status ${res.status}. Body: ${errorBody || "empty"}`
    );
  }

  const result = (await res.json()) as any;
  console.log(
    `[Queue Consumer] Scan success for tracker ${trackerId}. Changes detected: ${result.changesDetected}`
  );
}

/**
 * Calculates Cloudflare Queues custom retry delay in seconds
 * Retry Strategy:
 * - Attempt 2: 1 min (60s)
 * - Attempt 3: 5 min (300s)
 * - Attempt 4: 15 min (900s)
 */
export function calculateRetryDelay(attempts: number): number {
  switch (attempts) {
    case 1:
      return 60; // 1 minute
    case 2:
      return 300; // 5 minutes
    case 3:
      return 900; // 15 minutes
    default:
      return 900;
  }
}

/**
 * Logs a final failure when all queue retries are exhausted
 */
export async function handleFailedJob(
  trackerId: string,
  userId: string,
  env: Bindings,
  error: any
): Promise<void> {
  const errorMsg = error?.message || String(error);
  console.error(
    `[Queue Consumer] [DLQ / Max Retries Exhausted] Tracker: ${trackerId}, User: ${userId}. Error: ${errorMsg}`
  );

  // Note: Since the Next.js server was unreachable or persistently failing,
  // we log a final incident record. In production, this can also write
  // directly to Firestore REST if service account credentials are provided,
  // or push to a Dead Letter Queue (DLQ).
  try {
    // We log the incident to console. In Cloudflare, this goes to centralized logs (Sentry/Worker Logs)
    console.error(`[INCIDENT] Background worker failed to contact Next.js backend to crawl tracker ${trackerId}.`);
  } catch (err) {
    console.error("Failed to log queue failure incident:", err);
  }
}
