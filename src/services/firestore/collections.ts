import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { Collection } from "@/types/database";
import { logger } from "@/utils/logger";

// 1. Collection Converter
export const collectionConverter: FirestoreDataConverter<Collection> = {
  toFirestore(col: Collection): DocumentData {
    const { id, ...data } = col;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Collection {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name ?? "",
      description: data.description,
      color: data.color ?? "#3B82F6",
      icon: data.icon ?? "folder",
      trackerCount: data.trackerCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

// 2. Repository API
export class CollectionRepository {
  /**
   * Fetches a single collection document for a user
   */
  static async getCollection(userId: string, collectionId: string): Promise<Collection | null> {
    try {
      const docRef = doc(db, "users", userId, "collections", collectionId).withConverter(
        collectionConverter
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_collection_failed",
        userId,
        metadata: { collectionId },
        error,
      });
      throw error;
    }
  }

  /**
   * Creates a new tracker collection/folder for a user
   */
  static async createCollection(userId: string, col: Collection): Promise<void> {
    try {
      const docRef = doc(db, "users", userId, "collections", col.id).withConverter(
        collectionConverter
      );
      await setDoc(docRef, col);
      logger.info({
        service: "firestore",
        event: "collection_created",
        userId,
        metadata: { name: col.name },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "create_collection_failed",
        userId,
        metadata: { collectionId: col.id },
        error,
      });
      throw error;
    }
  }

  /**
   * Updates fields of a collection document
   */
  static async updateCollection(
    userId: string,
    collectionId: string,
    data: Partial<Omit<Collection, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const docRef = doc(db, "users", userId, "collections", collectionId).withConverter(
        collectionConverter
      );
      await updateDoc(docRef, { ...data, updatedAt: new Date() });
      logger.info({
        service: "firestore",
        event: "collection_updated",
        userId,
        metadata: { collectionId },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "update_collection_failed",
        userId,
        metadata: { collectionId },
        error,
      });
      throw error;
    }
  }

  /**
   * Deletes a collection document for a user
   */
  static async deleteCollection(userId: string, collectionId: string): Promise<void> {
    try {
      const docRef = doc(db, "users", userId, "collections", collectionId);
      await deleteDoc(docRef);
      logger.info({
        service: "firestore",
        event: "collection_deleted",
        userId,
        metadata: { collectionId },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "delete_collection_failed",
        userId,
        metadata: { collectionId },
        error,
      });
      throw error;
    }
  }

  /**
   * Lists all collections/folders for a user ordered by creation date
   */
  static async listCollections(userId: string): Promise<Collection[]> {
    try {
      const q = query(
        collection(db, "users", userId, "collections").withConverter(collectionConverter),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "list_collections_failed",
        userId,
        error,
      });
      throw error;
    }
  }
}
