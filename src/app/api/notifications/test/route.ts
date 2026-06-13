export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/notifications/resend";
import { sendTelegramTest } from "@/services/notifications/telegram";
import { logger } from "@/utils/logger";

/**
 * Endpoint to test email and Telegram bot integration channels
 * POST /api/notifications/test
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, telegramChatId, channels } = body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ success: false, error: "No notification channels specified" }, { status: 400 });
    }

    const results: Record<string, boolean> = {};

    logger.info({
      service: "notification",
      event: "channel_test_triggered",
      metadata: { channels, email, hasChatId: !!telegramChatId },
    });

    if (channels.includes("email")) {
      if (!email) {
        return NextResponse.json({ success: false, error: "Email address is required for testing" }, { status: 400 });
      }

      const htmlContent = `
        <div style="background-color: #030712; color: #f3f4f6; font-family: sans-serif; padding: 40px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #06b6d4; margin-bottom: 16px;">Test Notification</h1>
            <p style="color: #9ca3af; line-height: 1.5; margin-bottom: 24px;">
              This is a test notification from your <b>Traxo</b> account. If you are reading this, your email alerting integration via Resend is working perfectly!
            </p>
            <div style="font-size: 12px; color: #4b5563; border-top: 1px solid #1f2937; padding-top: 16px;">
              Traxo Alerting Service â€¢ ${new Date().toUTCString()}
            </div>
          </div>
        </div>
      `;

      results.email = await sendEmail(email, "Traxo Scanner - Test Alert", htmlContent);
    }

    if (channels.includes("telegram")) {
      if (!telegramChatId) {
        return NextResponse.json({ success: false, error: "Telegram Chat ID is required for testing" }, { status: 400 });
      }

      results.telegram = await sendTelegramTest(telegramChatId);
    }

    const allSuccessful = Object.values(results).every((r) => r === true);

    return NextResponse.json({
      success: allSuccessful,
      results,
      message: allSuccessful
        ? "All test notifications triggered successfully."
        : "Some test notifications failed to deliver.",
    });
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "channel_test_exception",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

