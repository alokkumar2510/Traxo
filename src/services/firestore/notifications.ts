import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationLog } from "@/types/database";
import { logger } from "@/utils/logger";

// 1. Notification Converter
export const notificationConverter: FirestoreDataConverter<NotificationLog> = {
  toFirestore(notif: NotificationLog): DocumentData {
    const { id, ...data } = notif;
    const cleanData = { ...data } as DocumentData;
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    return cleanData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): NotificationLog {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      trackerId: data.trackerId ?? "",
      eventId: data.eventId ?? "",
      channel: data.channel ?? "email",
      status: data.status ?? "pending",
      read: data.read ?? false,
      sentAt: data.sentAt,
      createdAt: data.createdAt,
    };
  },
};

// 2. Repository API
export class NotificationRepository {
  /**
   * Fetches a single notification log for a user
   */
  static async getNotification(userId: string, notificationId: string): Promise<NotificationLog | null> {
    try {
      const docRef = doc(db, "users", userId, "notifications", notificationId).withConverter(
        notificationConverter
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_notification_failed",
        userId,
        metadata: { notificationId },
        error,
      });
      throw error;
    }
  }

  /**
   * Logs a new notification dispatch attempt
   */
  static async createNotification(userId: string, notif: NotificationLog): Promise<void> {
    try {
      const docRef = doc(db, "users", userId, "notifications", notif.id).withConverter(
        notificationConverter
      );
      await setDoc(docRef, notif);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "create_notification_failed",
        userId,
        metadata: { notifId: notif.id },
        error,
      });
      throw error;
    }
  }

  /**
   * Updates fields of a notification log
   */
  static async updateNotification(
    userId: string,
    notificationId: string,
    data: Partial<Omit<NotificationLog, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const docRef = doc(db, "users", userId, "notifications", notificationId).withConverter(
        notificationConverter
      );
      // Strip undefined values to prevent Firestore from throwing errors
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(docRef, cleanData);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "update_notification_failed",
        userId,
        metadata: { notificationId },
        error,
      });
      throw error;
    }
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.updateNotification(userId, notificationId, { read: true });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "mark_notification_as_read_failed",
        userId,
        metadata: { notificationId },
        error,
      });
      throw error;
    }
  }

  /**
   * Marks all unread user notifications as read in a single batch
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "users", userId, "notifications").withConverter(notificationConverter),
        where("read", "==", false),
        limit(250) // Firestore batch limit is 500 operations
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
      
      logger.info({
        service: "firestore",
        event: "all_notifications_marked_read",
        userId,
        metadata: { count: snap.docs.length },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "mark_all_notifications_read_failed",
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Lists notifications logs for a user with pagination
   */
  static async listNotifications(
    userId: string,
    limitVal = 15,
    startAfterDoc?: QueryDocumentSnapshot<NotificationLog>
  ): Promise<{
    notifications: NotificationLog[];
    lastVisible?: QueryDocumentSnapshot<NotificationLog>;
  }> {
    try {
      let q = query(
        collection(db, "users", userId, "notifications").withConverter(notificationConverter),
        orderBy("createdAt", "desc"),
        limit(limitVal)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snap = await getDocs(q);
      const notifications = snap.docs.map((doc) => doc.data());
      const lastVisible = snap.docs[
        snap.docs.length - 1
      ] as QueryDocumentSnapshot<NotificationLog> | undefined;

      return { notifications, lastVisible };
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "list_notifications_failed",
        userId,
        error,
      });
      throw error;
    }
  }
}
