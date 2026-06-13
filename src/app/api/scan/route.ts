export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { MonitoringEngine } from "@/services/monitoring/engine";
import { logger } from "@/utils/logger";

/**
 * Secure HTTP endpoint to trigger a website scan run synchronously
 * POST /api/scan
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.INTERNAL_API_SECRET;

    // Validate Authorization token
    if (!secret || authHeader !== `Bearer ${secret}`) {
      logger.warn({
        service: "monitoring",
        event: "internal_api_scan_unauthorized",
        metadata: { hasHeader: !!authHeader },
      });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { trackerId } = body;

    if (!trackerId) {
      return NextResponse.json({ success: false, error: "Missing trackerId parameter" }, { status: 400 });
    }

    logger.info({
      service: "monitoring",
      event: "internal_api_scan_triggered",
      trackerId,
    });

    const result = await MonitoringEngine.runScan(trackerId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Scan execution failed",
        responseTime: result.responseTime,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      changesDetected: result.changesDetected,
      responseTime: result.responseTime,
    });
  } catch (error: any) {
    logger.error({
      service: "monitoring",
      event: "internal_api_scan_exception",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

