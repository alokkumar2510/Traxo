import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { UserProfile, UserPreferences } from "@/types/database";
import { logger } from "@/utils/logger";
import { AuthenticationError } from "@/utils/errors";

// 1. UserProfile Converter
export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(profile: UserProfile): DocumentData {
    const { id, ...data } = profile;
    const cleanData = { ...data } as DocumentData;
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    return cleanData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserProfile {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      photoURL: data.photoURL,
      plan: data.plan ?? "free",
      provider: data.provider ?? "email",
      emailVerified: data.emailVerified ?? false,
      onboardingCompleted: data.onboardingCompleted ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

// 2. UserPreferences Converter
export const userPreferencesConverter: FirestoreDataConverter<UserPreferences> = {
  toFirestore(prefs: UserPreferences): DocumentData {
    const data = { ...prefs } as DocumentData;
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserPreferences {
    const data = snapshot.data();
    return {
      theme: data.theme ?? "dark",
      emailNotifications: data.emailNotifications ?? true,
      telegramNotifications: data.telegramNotifications ?? false,
      telegramChatId: data.telegramChatId,
      defaultFrequency: data.defaultFrequency ?? "daily",
      timezone: data.timezone ?? "UTC",
      updatedAt: data.updatedAt,
    };
  },
};

// 3. Repository API
export class UserRepository {
  /**
   * Fetches user profile data from Firestore
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, "users", userId).withConverter(userProfileConverter);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_user_profile_failed",
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Creates or overwrites a user profile document
   */
  static async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      const userDocRef = doc(db, "users", profile.id).withConverter(userProfileConverter);
      await setDoc(userDocRef, profile);
      logger.info({
        service: "firestore",
        event: "user_profile_created",
        userId: profile.id,
        metadata: { email: profile.email },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "create_user_profile_failed",
        userId: profile.id,
        error,
      });
      throw error;
    }
  }

  /**
   * Updates partial user profile fields
   */
  static async updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "id" | "createdAt">>): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId).withConverter(userProfileConverter);
      // Strip undefined values to prevent Firestore from throwing errors
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(userDocRef, { ...cleanData, updatedAt: new Date() });
      logger.info({
        service: "firestore",
        event: "user_profile_updated",
        userId,
        metadata: { keys: Object.keys(data) },
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "update_user_profile_failed",
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Gets user preferences subcollection document
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const prefsRef = doc(db, "users", userId, "preferences", "default").withConverter(
        userPreferencesConverter
      );
      const prefsSnap = await getDoc(prefsRef);
      if (prefsSnap.exists()) {
        return prefsSnap.data();
      }
      return null;
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "get_user_preferences_failed",
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Creates or updates user default preferences
   */
  static async saveUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
    try {
      const prefsRef = doc(db, "users", userId, "preferences", "default").withConverter(
        userPreferencesConverter
      );
      await setDoc(prefsRef, prefs);
      logger.info({
        service: "firestore",
        event: "user_preferences_saved",
        userId,
      });
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "save_user_preferences_failed",
        userId,
        error,
      });
      throw error;
    }
  }
}
