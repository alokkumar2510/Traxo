import { Hono } from "hono";
import { z } from "zod";
import { Bindings, Variables, NotificationLog } from "../types";
import { FirestoreClient } from "../utils/firestore";

const notificationsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Zod validation schemas
const createNotificationSchema = z.object({
  trackerId: z.string().min(1, "Tracker ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  channel: z.enum(["email", "telegram"]),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
});

// 2. Endpoints

// GET /api/notifications - Get user's notification log feed
notificationsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  const limitParam = c.req.query("limit");
  const limitVal = limitParam ? parseInt(limitParam, 10) : 20;

  const query = {
    from: [{ collectionId: "notifications" }],
    orderBy: [
      {
        field: { fieldPath: "createdAt" },
        direction: "DESCENDING",
      },
    ],
    limit: limitVal,
  };

  try {
    const list = await db.runQuery<NotificationLog>(query, `users/${userId}`);
    return c.json({ success: true, notifications: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/notifications/:id/read - Mark notification as read
notificationsRouter.post("/:id/read", async (c) => {
  const userId = c.get("userId");
  const notificationId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const docPath = `users/${userId}/notifications/${notificationId}`;
    const notification = await db.getDocument<NotificationLog>(docPath);
    if (!notification) {
      return c.json({ success: false, error: "Notification not found" }, 404);
    }

    await db.updateDocument(docPath, { read: true });
    return c.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/notifications/read-all - Mark all unread notifications read
notificationsRouter.post("/read-all", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    // 1. Fetch unread notifications
    const query = {
      from: [{ collectionId: "notifications" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "read" },
          op: "EQUAL",
          value: { booleanValue: false },
        },
      },
      limit: 250, // Batch limit is 500 writes
    };

    const unreadNotifications = await db.runQuery<NotificationLog>(query, `users/${userId}`);
    if (unreadNotifications.length === 0) {
      return c.json({ success: true, count: 0, message: "No unread notifications" });
    }

    // 2. Perform a commit batch write using REST API
    const writes = unreadNotifications.map((notif) => {
      const docName = `projects/${c.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/notifications/${notif.id}`;
      return {
        update: {
          name: docName,
          fields: {
            read: { booleanValue: true },
          },
        },
        updateMask: {
          fieldPaths: ["read"],
        },
      };
    });

    const commitUrl = `https://firestore.googleapis.com/v1/projects/${c.env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`;
    const res = await fetch(commitUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ writes }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore batch commit failed: ${errBody}`);
    }

    return c.json({
      success: true,
      count: unreadNotifications.length,
      message: `Successfully marked ${unreadNotifications.length} notifications as read.`,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/notifications - Log a new notification dispatch
notificationsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const body = await c.req.json();
    const validated = createNotificationSchema.parse(body);

    const notificationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newNotification: NotificationLog = {
      id: notificationId,
      trackerId: validated.trackerId,
      eventId: validated.eventId,
      channel: validated.channel,
      status: validated.status,
      read: false,
      createdAt: now,
      sentAt: validated.status === "sent" ? now : undefined,
    };

    const docPath = `users/${userId}/notifications`;
    const doc = await db.createDocument<NotificationLog>(docPath, notificationId, newNotification);

    return c.json({ success: true, notification: doc }, 201 as any);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default notificationsRouter;
