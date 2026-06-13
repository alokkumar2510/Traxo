export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { trackerConverter } from "@/services/firestore/trackers";
import { logger } from "@/utils/logger";

/**
 * Secure HTTP endpoint to query active trackers matching a specific frequency
 * POST /api/scan/schedule
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.INTERNAL_API_SECRET;

    // Validate Authorization token
    if (!secret || authHeader !== `Bearer ${secret}`) {
      logger.warn({
        service: "monitoring",
        event: "internal_api_schedule_unauthorized",
        metadata: { hasHeader: !!authHeader },
      });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { frequency } = body;

    if (!frequency) {
      return NextResponse.json({ success: false, error: "Missing frequency parameter" }, { status: 400 });
    }

    logger.info({
      service: "monitoring",
      event: "internal_api_schedule_query",
      metadata: { frequency },
    });

    // Query active trackers matching target frequency
    const q = query(
      collection(db, "trackers").withConverter(trackerConverter),
      where("status", "==", "active"),
      where("frequency", "==", frequency)
    );

    const snap = await getDocs(q);
    const trackers = snap.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
    }));

    logger.info({
      service: "monitoring",
      event: "internal_api_schedule_query_success",
      metadata: { frequency, count: trackers.length },
    });

    return NextResponse.json({
      success: true,
      trackers,
    });
  } catch (error: any) {
    logger.error({
      service: "monitoring",
      event: "internal_api_schedule_exception",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

