import { Tracker, TrackerEvent } from "@/types/database";
import { logger } from "@/utils/logger";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sends a message via the Telegram Bot API
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!botToken) {
    logger.warn({
      service: "notification",
      event: "telegram_alert_skipped",
      metadata: { reason: "TELEGRAM_BOT_TOKEN is not defined in environment variables" },
    });
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    logger.info({
      service: "notification",
      event: "telegram_sending_message",
      metadata: { chatId },
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Telegram API returned status ${res.status}: ${errorText}`);
    }

    logger.info({
      service: "notification",
      event: "telegram_message_sent_success",
      metadata: { chatId },
    });

    return true;
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "telegram_message_failed",
      error: error.message || error,
    });
    return false;
  }
}

/**
 * Sends a photo message via the Telegram Bot API
 */
export async function sendTelegramPhoto(chatId: string, photo: string, caption: string): Promise<boolean> {
  if (!botToken) {
    logger.warn({
      service: "notification",
      event: "telegram_photo_skipped",
      metadata: { reason: "TELEGRAM_BOT_TOKEN is not defined in environment variables" },
    });
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    
    logger.info({
      service: "notification",
      event: "telegram_sending_photo",
      metadata: { chatId, photo },
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        caption,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Telegram API returned status ${res.status}: ${errorText}`);
    }

    logger.info({
      service: "notification",
      event: "telegram_photo_sent_success",
      metadata: { chatId },
    });

    return true;
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "telegram_photo_failed",
      error: error.message || error,
    });
    return false;
  }
}

/**
 * Sends a beautifully formatted tracker change alert to a user's Telegram chat
 */
export async function sendTelegramAlert(
  chatId: string,
  tracker: Tracker,
  event: TrackerEvent
): Promise<boolean> {
  let severityEmoji = "ℹ️";
  if (event.severity === "high") severityEmoji = "🔴";
  else if (event.severity === "medium") severityEmoji = "🟡";

  let trackerEmoji = "🌐";
  if (tracker.type === "price") trackerEmoji = "🏷️";
  else if (tracker.type === "job") trackerEmoji = "💼";
  else if (tracker.type === "pdf") trackerEmoji = "📄";
  else if (tracker.type === "section") trackerEmoji = "🎯";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://traxo.alokkumarsahu.in";
  const dashboardLink = `${appUrl}/trackers/${tracker.id}`;

  const message = `
🔔 <b>Traxo Change Alert!</b>

${trackerEmoji} <b>Tracker:</b> ${tracker.name}
🔗 <b>Link:</b> <a href="${tracker.url}">Visit Website</a>
⚡ <b>Severity:</b> ${severityEmoji} ${event.severity.toUpperCase()}

⚠️ <b>${event.title}</b>
<i>${event.summary}</i>

👉 <a href="${dashboardLink}">View Details on Dashboard</a>
`;

  const diffImageUrl = (event.metadata as any)?.visualDiff?.diffImageUrl;
  if (diffImageUrl) {
    const photoSuccess = await sendTelegramPhoto(chatId, diffImageUrl, message.trim());
    if (photoSuccess) return true;
  }

  return sendTelegramMessage(chatId, message.trim());
}

/**
 * Sends a connection confirmation test message
 */
export async function sendTelegramTest(chatId: string): Promise<boolean> {
  const message = `
✅ <b>Telegram connected successfully!</b>

You have successfully linked this chat to your <b>Traxo</b> account. 
You will receive real-time updates and scan alerts directly in this thread!
`;
  return sendTelegramMessage(chatId, message.trim());
}
