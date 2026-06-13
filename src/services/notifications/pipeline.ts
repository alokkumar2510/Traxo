import { Timestamp, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationLog } from "@/types/database";
import { TrackerRepository } from "../firestore/trackers";
import { UserRepository } from "../firestore/users";
import { NotificationRepository, notificationConverter } from "../firestore/notifications";
import { sendEmail, compileAlertEmail } from "./resend";
import { sendTelegramAlert } from "./telegram";
import { logger } from "@/utils/logger";

export class NotificationPipeline {
  /**
   * Scans and dispatches all pending notifications for a specific change event
   */
  static async dispatchPendingNotifications(userId: string, eventId: string): Promise<void> {
    logger.info({
      service: "notification",
      event: "pipeline_dispatch_started",
      userId,
      metadata: { eventId },
    });

    try {
      // 1. Fetch all pending notification logs for this event
      const notifQuery = query(
        collection(db, "users", userId, "notifications").withConverter(
          notificationConverter
        ),
        where("eventId", "==", eventId),
        where("status", "==", "pending")
      );

      const querySnap = await getDocs(notifQuery);
      if (querySnap.empty) {
        logger.info({
          service: "notification",
          event: "pipeline_dispatch_empty",
          userId,
          metadata: { eventId },
        });
        return;
      }

      // 2. Fetch User Profile & Preferences
      const userProfile = await UserRepository.getUserProfile(userId);
      const userPrefs = await UserRepository.getUserPreferences(userId);

      if (!userProfile) {
        throw new Error(`User profile not found for ID: ${userId}`);
      }

      const logs = querySnap.docs.map((d) => d.data() as NotificationLog);

      for (const log of logs) {
        // 3. Fetch Tracker and Event details
        const tracker = await TrackerRepository.getTracker(log.trackerId);
        
        // Find the event from tracker events list
        const events = await TrackerRepository.listEvents(log.trackerId, 20);
        const event = events.find((e) => e.id === eventId);

        if (!tracker || !event) {
          logger.error({
            service: "notification",
            event: "pipeline_missing_relations",
            trackerId: log.trackerId,
            metadata: { logId: log.id, eventId },
          });
          await NotificationRepository.updateNotification(userId, log.id, {
            status: "failed",
          });
          continue;
        }

        const now = Timestamp.fromDate(new Date());

        // 4. Dispatch by channel
        if (log.channel === "email") {
          const htmlContent = compileAlertEmail(tracker, event);
          const success = await sendEmail(
            userProfile.email,
            `Traxo Alert: ${event.title}`,
            htmlContent
          );

          await NotificationRepository.updateNotification(userId, log.id, {
            status: success ? "sent" : "failed",
            sentAt: success ? now as any : undefined,
          });
        } else if (log.channel === "telegram") {
          const chatId = userPrefs?.telegramChatId;
          
          if (!chatId) {
            logger.warn({
              service: "notification",
              event: "telegram_no_chat_id",
              userId,
              metadata: { logId: log.id },
            });
            await NotificationRepository.updateNotification(userId, log.id, {
              status: "failed",
            });
            continue;
          }

          const success = await sendTelegramAlert(chatId, tracker, event);
          
          await NotificationRepository.updateNotification(userId, log.id, {
            status: success ? "sent" : "failed",
            sentAt: success ? now as any : undefined,
          });
        }
      }

      logger.info({
        service: "notification",
        event: "pipeline_dispatch_completed",
        userId,
        metadata: { eventId, count: logs.length },
      });
    } catch (error: any) {
      logger.error({
        service: "notification",
        event: "pipeline_dispatch_failed",
        userId,
        metadata: { eventId },
        error: error.message || error,
      });
      throw error;
    }
  }
}
