import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  collectionGroup,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { Tracker, Snapshot, ScanRecord, TrackerEvent, Screenshot } from "@/types/database";
import { logger } from "@/utils/logger";

// 1. Tracker Converter
export const trackerConverter: FirestoreDataConverter<Tracker> = {
  toFirestore(tracker: Tracker): DocumentData {
    const { id, ...data } = tracker;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Tracker {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId ?? "",
      collectionId: data.collectionId,
      name: data.name ?? "",
      description: data.description,
      url: data.url ?? "",
      type: data.type ?? "website",
      status: data.status ?? "active",
      frequency: data.frequency ?? "daily",
      lastScanAt: data.lastScanAt,
      nextScanAt: data.nextScanAt,
      changeCount: data.changeCount ?? 0,
      isPublic: data.isPublic ?? false,
      tags: data.tags ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      sectionConfig: data.sectionConfig,
      jobConfig: data.jobConfig,
      priceConfig: data.priceConfig,
      pdfConfig: data.pdfConfig,
    };
  },
};

import { compressText, decompressText } from "@/utils/compression";

// 2. Snapshot Converter
export const snapshotConverter: FirestoreDataConverter<Snapshot> = {
  toFirestore(snap: Snapshot): DocumentData {
    const { id, ...data } = snap;
    return {
      ...data,
      content: compressText(data.content),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Snapshot {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      trackerId: data.trackerId ?? "",
      hash: data.hash ?? "",
      content: decompressText(data.content ?? ""),
      contentLength: data.contentLength ?? 0,
      createdAt: data.createdAt,
    };
  },
};

// 3. ScanRecord Converter
export const scanConverter: FirestoreDataConverter<ScanRecord> = {
  toFirestore(scan: ScanRecord): DocumentData {
    const { id, ...data } = scan;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ScanRecord {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      status: data.status ?? "success",
      responseTime: data.responseTime ?? 0,
      statusCode: data.statusCode,
      error: data.error,
      changesDetected: data.changesDetected ?? false,
      scannedAt: data.scannedAt,
    };
  },
};

// 4. TrackerEvent Converter
export const eventConverter: FirestoreDataConverter<TrackerEvent> = {
  toFirestore(event: TrackerEvent): DocumentData {
    const { id, ...data } = event;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): TrackerEvent {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      trackerId: data.trackerId ?? "",
      type: data.type ?? "content_changed",
      title: data.title ?? "",
      summary: data.summary ?? "",
      severity: data.severity ?? "low",
      metadata: data.metadata ?? {},
      createdAt: data.createdAt,
    };
  },
};

// 4.5 Screenshot Converter
export const screenshotConverter: FirestoreDataConverter<Screenshot> = {
  toFirestore(snap: Screenshot): DocumentData {
    const { id, ...data } = snap;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Screenshot {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      imageUrl: data.imageUrl ?? "",
      storagePath: data.storagePath ?? "",
      width: data.width ?? 0,
      height: data.height ?? 0,
      createdAt: data.createdAt,
    };
  },
};

// 5. Repository API
export class TrackerRepository {
  /**
   * Fetches a single tracker document by ID
   */
  static async getTracker(trackerId: string): Promise<Tracker | null> {
    try {
      const docRef = doc(db, "trackers", trackerId).withConverter(trackerConverter);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_tracker_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Creates a new tracker document
   */
  static async createTracker(tracker: Tracker): Promise<void> {
    try {
      const docRef = doc(db, "trackers", tracker.id).withConverter(trackerConverter);
      await setDoc(docRef, tracker);
      logger.info({
        service: "firestore",
        event: "tracker_created",
        trackerId: tracker.id,
        userId: tracker.userId,
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "create_tracker_failed",
        trackerId: tracker.id,
        error,
      });
      throw error;
    }
  }

  /**
   * Updates partial fields in a tracker document
   */
  static async updateTracker(trackerId: string, data: Partial<Omit<Tracker, "id" | "userId" | "createdAt">>): Promise<void> {
    try {
      const docRef = doc(db, "trackers", trackerId).withConverter(trackerConverter);
      await updateDoc(docRef, { ...data, updatedAt: new Date() });
      logger.info({
        service: "firestore",
        event: "tracker_updated",
        trackerId,
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "update_tracker_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Deletes a tracker and clean up associated subcollection records (using batching)
   */
  static async deleteTracker(trackerId: string): Promise<void> {
    try {
      const trackerRef = doc(db, "trackers", trackerId);
      
      // Delete the tracker document itself
      await deleteDoc(trackerRef);
      
      logger.info({
        service: "firestore",
        event: "tracker_deleted",
        trackerId,
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "delete_tracker_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Lists all trackers owned by a specific user with pagination support
   */
  static async listTrackers(
    userId: string,
    limitVal = 10,
    startAfterDoc?: QueryDocumentSnapshot<Tracker>
  ): Promise<{ trackers: Tracker[]; lastVisible?: QueryDocumentSnapshot<Tracker> }> {
    try {
      let q = query(
        collection(db, "trackers").withConverter(trackerConverter),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitVal)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snap = await getDocs(q);
      const trackers = snap.docs.map((doc) => doc.data());
      const lastVisible = snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<Tracker> | undefined;

      return { trackers, lastVisible };
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "list_trackers_failed",
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Lists trackers inside a specific collection
   */
  static async listTrackersByCollection(userId: string, collectionId: string): Promise<Tracker[]> {
    try {
      const q = query(
        collection(db, "trackers").withConverter(trackerConverter),
        where("userId", "==", userId),
        where("collectionId", "==", collectionId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "list_trackers_by_collection_failed",
        userId,
        metadata: { collectionId },
        error,
      });
      throw error;
    }
  }

  // --- Subcollections Operations ---

  /**
   * Saves a webpage snapshot version
   */
  static async saveSnapshot(trackerId: string, snapshot: Snapshot): Promise<void> {
    try {
      const snapRef = doc(db, "trackers", trackerId, "snapshots", snapshot.id).withConverter(
        snapshotConverter
      );
      await setDoc(snapRef, snapshot);
      logger.debug({
        service: "firestore",
        event: "snapshot_saved",
        trackerId,
        metadata: { length: snapshot.contentLength },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "save_snapshot_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Fetches the latest snapshot for a tracker
   */
  static async getLatestSnapshot(trackerId: string): Promise<Snapshot | null> {
    try {
      const q = query(
        collection(db, "trackers", trackerId, "snapshots").withConverter(snapshotConverter),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_latest_snapshot_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Saves a monitoring scan result
   */
  static async saveScanRecord(trackerId: string, scan: ScanRecord): Promise<void> {
    try {
      const scanRef = doc(db, "trackers", trackerId, "scans", scan.id).withConverter(scanConverter);
      await setDoc(scanRef, scan);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "save_scan_record_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Saves a change event
   */
  static async saveEvent(trackerId: string, event: TrackerEvent): Promise<void> {
    try {
      const eventRef = doc(db, "trackers", trackerId, "events", event.id).withConverter(
        eventConverter
      );
      await setDoc(eventRef, event);
      logger.info({
        service: "firestore",
        event: "event_saved",
        trackerId,
        metadata: { type: event.type },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "save_event_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Lists the most recent events for a single tracker
   */
  static async listEvents(trackerId: string, limitVal = 10): Promise<TrackerEvent[]> {
    try {
      const q = query(
        collection(db, "trackers", trackerId, "events").withConverter(eventConverter),
        orderBy("createdAt", "desc"),
        limit(limitVal)
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "list_events_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Saves a screenshot record
   */
  static async saveScreenshotRecord(trackerId: string, screenshot: Screenshot): Promise<void> {
    try {
      const docRef = doc(db, "trackers", trackerId, "screenshots", screenshot.id).withConverter(
        screenshotConverter
      );
      await setDoc(docRef, screenshot);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "save_screenshot_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Fetches the latest screenshot record for a tracker
   */
  static async getLatestScreenshotRecord(trackerId: string): Promise<Screenshot | null> {
    try {
      const q = query(
        collection(db, "trackers", trackerId, "screenshots").withConverter(screenshotConverter),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_latest_screenshot_failed",
        trackerId,
        error,
      });
      throw error;
    }
  }
}
