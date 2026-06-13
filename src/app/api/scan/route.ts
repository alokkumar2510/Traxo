export const dynamic = 'force-static';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { MonitoringEngine } from "@/services/monitoring/engine";
import { logger } from "@/utils/logger";
import { auth } from "@/services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
        metadata: { hasHeader: !!authHeader, secretLength: secret ? secret.length : 0 },
      });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Authenticate as the system scanner user in Firestore Client SDK
    if (!auth.currentUser) {
      const email = process.env.SYSTEM_SCANNER_EMAIL;
      const password = process.env.SYSTEM_SCANNER_PASSWORD;
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
        logger.info({
          service: "monitoring",
          event: "system_scanner_authenticated",
          metadata: { email },
        });
      } else {
        logger.error({
          service: "monitoring",
          event: "system_scanner_auth_failed",
          error: "System scanner credentials missing from environment",
        });
      }
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



