export const dynamic = 'force-static';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/firebase";
import { doc, getDoc, collection, setDoc, Timestamp } from "firebase/firestore";
import { TrackerRepository } from "@/services/firestore/trackers";
import { Tracker } from "@/types/database";
import { logger } from "@/utils/logger";
import { calculateNextScanAt } from "@/services/monitoring/engine";

// Helper to validate API Key and return the owner's userId
async function authenticateApiKey(req: NextRequest): Promise<string | null> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || !apiKey.startsWith("tx_live_")) return null;

  try {
    const keyRef = doc(db, "apiKeys", apiKey);
    const snap = await getDoc(keyRef);
    if (snap.exists() && snap.data().status === "active") {
      return snap.data().userId;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/v1/trackers
 * Lists trackers for the authenticated API Key owner
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await authenticateApiKey(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid x-api-key header." }, { status: 401 });
    }

    const { trackers } = await TrackerRepository.listTrackers(userId, 100);
    
    return NextResponse.json({
      success: true,
      trackers: trackers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        url: t.url,
        type: t.type,
        status: t.status,
        frequency: t.frequency,
        changeCount: t.changeCount,
        lastScanAt: t.lastScanAt?.toDate?.() ?? null,
        createdAt: t.createdAt?.toDate?.() ?? null,
      })),
    });
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "public_api_list_trackers_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/trackers
 * Creates a tracker for the authenticated API Key owner
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await authenticateApiKey(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid x-api-key header." }, { status: 401 });
    }

    const body = await req.json();
    const { name, url, type, frequency, collectionId } = body;

    if (!name || !url || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, url, type" }, { status: 400 });
    }

    const trackerId = crypto.randomUUID();
    const now = Timestamp.now();

    const newTracker: Tracker = {
      id: trackerId,
      userId,
      collectionId: collectionId || undefined,
      name: name.trim(),
      url: url.trim(),
      type: type || "website",
      status: "active",
      frequency: frequency || "daily",
      changeCount: 0,
      isPublic: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      nextScanAt: Timestamp.fromDate(calculateNextScanAt(frequency || "daily")),
    };

    await TrackerRepository.createTracker(newTracker);

    logger.info({
      service: "analytics",
      event: "public_api_tracker_created",
      userId,
      trackerId,
    });

    return NextResponse.json({
      success: true,
      tracker: {
        id: newTracker.id,
        name: newTracker.name,
        url: newTracker.url,
        type: newTracker.type,
        status: newTracker.status,
        frequency: newTracker.frequency,
        nextScanAt: newTracker.nextScanAt ? (newTracker.nextScanAt as any).toDate().toISOString() : "",
      },
    }, { status: 201 });
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "public_api_create_tracker_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}



