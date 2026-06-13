import { Hono } from "hono";
import { Bindings, Variables, UserAnalytics, TrackerMetrics, Tracker } from "../types";
import { FirestoreClient } from "../utils/firestore";

const analyticsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/analytics/summary - Get user overall analytics
analyticsRouter.get("/summary", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const docPath = `analytics/${userId}`;
    const stats = await db.getDocument<UserAnalytics>(docPath);
    
    if (!stats) {
      // Return beautiful fallback empty metrics for new users to prevent crash
      return c.json({
        success: true,
        analytics: {
          activeTrackers: 0,
          totalScans: 0,
          totalChanges: 0,
          notificationsSent: 0,
          successfulScans: 0,
          failedScans: 0,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return c.json({ success: true, analytics: stats });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/analytics/trackers/:trackerId/metrics - Get metrics for a specific tracker
analyticsRouter.get("/trackers/:trackerId/metrics", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("trackerId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    // 1. Verify ownership of tracker
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    // 2. Fetch metrics
    const metricsPath = `trackers/${trackerId}/metrics/default`;
    const metrics = await db.getDocument<TrackerMetrics>(metricsPath);

    if (!metrics) {
      // Return empty default metrics if no scans have completed yet
      return c.json({
        success: true,
        metrics: {
          totalScans: 0,
          successfulScans: 0,
          failedScans: 0,
          averageResponseTime: 0,
          changesDetected: 0,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    return c.json({ success: true, metrics });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default analyticsRouter;
