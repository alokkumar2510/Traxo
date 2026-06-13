import { Hono } from "hono";
import { z } from "zod";
import { Bindings, Variables, Tracker } from "../types";
import { FirestoreClient } from "../utils/firestore";

const trackersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Zod schemas for validation
const sectionConfigSchema = z.object({
  selector: z.string().min(1, "Selector is required"),
  selectorType: z.enum(["css", "xpath"]),
  monitoredElement: z.string().default(""),
});

const jobConfigSchema = z.object({
  role: z.string().optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().default(false),
  minExperience: z.number().optional(),
  maxExperience: z.number().optional(),
  keywords: z.array(z.string()).default([]),
});

const priceConfigSchema = z.object({
  targetPrice: z.number().optional(),
  currentPrice: z.number().optional(),
  lowestPrice: z.number().optional(),
  highestPrice: z.number().optional(),
  currency: z.string().default("INR"),
});

const pdfConfigSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
});

const createTrackerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["website", "section", "job", "price", "pdf"]),
  frequency: z.enum(["hourly", "6h", "12h", "daily"]),
  collectionId: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  
  // Embedded configs depending on type
  sectionConfig: sectionConfigSchema.optional(),
  jobConfig: jobConfigSchema.optional(),
  priceConfig: priceConfigSchema.optional(),
  pdfConfig: pdfConfigSchema.optional(),
});

const updateTrackerSchema = createTrackerSchema.partial();

// 2. Endpoints

// GET /api/trackers - List all trackers of logged-in user
trackersRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, c.req.header("Authorization")!.substring(7));

  const query = {
    from: [{ collectionId: "trackers" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "userId" },
        op: "EQUAL",
        value: { stringValue: userId },
      },
    },
  };

  try {
    const list = await db.runQuery<Tracker>(query);
    return c.json({ success: true, trackers: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/trackers/:id - Get tracker detail
trackersRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, c.req.header("Authorization")!.substring(7));

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    return c.json({ success: true, tracker });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/trackers - Create new tracker
trackersRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const body = await c.req.json();
    const validated = createTrackerSchema.parse(body);

    const trackerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newTracker: Tracker = {
      id: trackerId,
      userId,
      collectionId: validated.collectionId,
      name: validated.name,
      description: validated.description,
      url: validated.url,
      type: validated.type,
      status: "active",
      frequency: validated.frequency,
      changeCount: 0,
      isPublic: validated.isPublic,
      tags: validated.tags,
      createdAt: now,
      updatedAt: now,
      sectionConfig: validated.type === "section" ? validated.sectionConfig : undefined,
      jobConfig: validated.type === "job" ? validated.jobConfig : undefined,
      priceConfig: validated.type === "price" ? validated.priceConfig : undefined,
      pdfConfig: validated.type === "pdf" ? validated.pdfConfig : undefined,
    };

    const doc = await db.createDocument<Tracker>("trackers", trackerId, newTracker);
    
    // Automatically trigger an initial scan
    if (c.env.SCANS_QUEUE) {
      await c.env.SCANS_QUEUE.send({ trackerId, userId });
    }

    return c.json({ success: true, tracker: doc }, 210 as any); // 201 Created but let's send 200 or 201
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /api/trackers/:id - Update tracker
trackersRouter.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    const body = await c.req.json();
    const validated = updateTrackerSchema.parse(body);

    const now = new Date().toISOString();
    const updatedFields: Partial<Tracker> = {
      ...validated,
      updatedAt: now,
    };

    await db.updateDocument(`trackers/${trackerId}`, updatedFields);
    
    return c.json({ success: true, message: "Tracker updated successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/trackers/:id - Delete tracker
trackersRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    await db.deleteDocument(`trackers/${trackerId}`);
    return c.json({ success: true, message: "Tracker deleted successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/trackers/:id/pause - Pause tracker scanning
trackersRouter.post("/:id/pause", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    await db.updateDocument(`trackers/${trackerId}`, {
      status: "paused",
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: "Tracker paused successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/trackers/:id/resume - Resume tracker scanning
trackersRouter.post("/:id/resume", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    await db.updateDocument(`trackers/${trackerId}`, {
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: "Tracker resumed successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/trackers/:id/scan - Trigger scan immediately
trackersRouter.post("/:id/scan", async (c) => {
  const userId = c.get("userId");
  const trackerId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    if (tracker.status === "paused") {
      return c.json({ success: false, error: "Cannot scan a paused tracker. Resume it first." }, 400);
    }

    // Queue scanning message
    if (c.env.SCANS_QUEUE) {
      await c.env.SCANS_QUEUE.send({ trackerId, userId });
      return c.json({ success: true, message: "Scan request queued successfully" });
    }

    // Fallback if Queue not bound: mock scanning trigger success
    return c.json({
      success: true,
      message: "Scan triggered successfully (running in mock mode, no queue bound)",
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default trackersRouter;
