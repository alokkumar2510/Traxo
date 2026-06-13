import { Hono } from "hono";
import { z } from "zod";
import { Bindings, Variables, Collection, Tracker } from "../types";
import { FirestoreClient } from "../utils/firestore";

const collectionsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Zod validation schemas
const collectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  color: z.string().default("#3B82F6"),
  icon: z.string().default("folder"),
});

const associateTrackerSchema = z.object({
  trackerId: z.string().min(1, "Tracker ID is required"),
});

// 2. Endpoints

// GET /api/collections - List user's collections
collectionsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  const query = {
    from: [{ collectionId: "collections" }],
  };

  try {
    const list = await db.runQuery<Collection>(query, `users/${userId}`);
    return c.json({ success: true, collections: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collections/:id - Get collection details
collectionsRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const collectionId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const docPath = `users/${userId}/collections/${collectionId}`;
    const collection = await db.getDocument<Collection>(docPath);
    if (!collection) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }
    return c.json({ success: true, collection });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/collections - Create collection
collectionsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const body = await c.req.json();
    const validated = collectionSchema.parse(body);

    const collectionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newCollection: Collection = {
      id: collectionId,
      name: validated.name,
      description: validated.description,
      color: validated.color,
      icon: validated.icon,
      trackerCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docPath = `users/${userId}/collections`;
    const doc = await db.createDocument<Collection>(docPath, collectionId, newCollection);

    return c.json({ success: true, collection: doc }, 201 as any);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /api/collections/:id - Update collection details
collectionsRouter.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const collectionId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const docPath = `users/${userId}/collections/${collectionId}`;
    const collection = await db.getDocument<Collection>(docPath);
    if (!collection) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }

    const body = await c.req.json();
    const validated = collectionSchema.partial().parse(body);

    const now = new Date().toISOString();
    const updatedFields = {
      ...validated,
      updatedAt: now,
    };

    await db.updateDocument(docPath, updatedFields);
    return c.json({ success: true, message: "Collection updated successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/collections/:id - Delete collection
collectionsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const collectionId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    const colPath = `users/${userId}/collections/${collectionId}`;
    const collectionDoc = await db.getDocument<Collection>(colPath);
    if (!collectionDoc) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }

    // 1. Find all trackers in this collection and dissociate them
    const trackersQuery = {
      from: [{ collectionId: "trackers" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "userId" },
                op: "EQUAL",
                value: { stringValue: userId },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "collectionId" },
                op: "EQUAL",
                value: { stringValue: collectionId },
              },
            },
          ],
        },
      },
    };

    const trackers = await db.runQuery<Tracker>(trackersQuery);
    for (const tracker of trackers) {
      // Set collectionId to null/undefined (to dissociate)
      await db.updateDocument(`trackers/${tracker.id}`, { collectionId: "" });
    }

    // 2. Delete the collection itself
    await db.deleteDocument(colPath);

    return c.json({ success: true, message: "Collection deleted and trackers dissociated successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/collections/:id/trackers - Associate tracker to collection
collectionsRouter.post("/:id/trackers", async (c) => {
  const userId = c.get("userId");
  const collectionId = c.req.param("id");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    // 1. Verify collection exists
    const colPath = `users/${userId}/collections/${collectionId}`;
    const collectionDoc = await db.getDocument<Collection>(colPath);
    if (!collectionDoc) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }

    const body = await c.req.json();
    const { trackerId } = associateTrackerSchema.parse(body);

    // 2. Verify tracker exists and belongs to user
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    // 3. Update tracker's collectionId
    const oldCollectionId = tracker.collectionId;
    if (oldCollectionId === collectionId) {
      return c.json({ success: true, message: "Tracker already in this collection" });
    }

    await db.updateDocument(`trackers/${trackerId}`, { collectionId });

    // 4. Adjust trackerCount on collections
    await db.updateDocument(colPath, {
      trackerCount: (collectionDoc.trackerCount || 0) + 1,
    });

    if (oldCollectionId) {
      const oldColPath = `users/${userId}/collections/${oldCollectionId}`;
      const oldCol = await db.getDocument<Collection>(oldColPath);
      if (oldCol) {
        await db.updateDocument(oldColPath, {
          trackerCount: Math.max(0, (oldCol.trackerCount || 0) - 1),
        });
      }
    }

    return c.json({ success: true, message: "Tracker associated with collection successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return c.json({ success: false, error: "Validation failed", details: error.errors }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/collections/:id/trackers/:trackerId - Remove tracker from collection
collectionsRouter.delete("/:id/trackers/:trackerId", async (c) => {
  const userId = c.get("userId");
  const collectionId = c.req.param("id");
  const trackerId = c.req.param("trackerId");
  const token = c.req.header("Authorization")!.substring(7);
  const db = new FirestoreClient(c.env.FIREBASE_PROJECT_ID, token);

  try {
    // 1. Verify collection exists
    const colPath = `users/${userId}/collections/${collectionId}`;
    const collectionDoc = await db.getDocument<Collection>(colPath);
    if (!collectionDoc) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }

    // 2. Verify tracker exists and belongs to user
    const tracker = await db.getDocument<Tracker>(`trackers/${trackerId}`);
    if (!tracker) {
      return c.json({ success: false, error: "Tracker not found" }, 404);
    }

    if (tracker.userId !== userId) {
      return c.json({ success: false, error: "Forbidden. Access denied." }, 403);
    }

    if (tracker.collectionId !== collectionId) {
      return c.json({ success: false, error: "Tracker is not associated with this collection" }, 400);
    }

    // 3. Remove collectionId from tracker
    await db.updateDocument(`trackers/${trackerId}`, { collectionId: "" });

    // 4. Decrement trackerCount
    await db.updateDocument(colPath, {
      trackerCount: Math.max(0, (collectionDoc.trackerCount || 0) - 1),
    });

    return c.json({ success: true, message: "Tracker removed from collection successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default collectionsRouter;
