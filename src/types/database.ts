import { Timestamp } from "firebase/firestore";

export type UserPlan = "free" | "pro" | "business";
export type AuthProvider = "google" | "email";
export type TrackerType = "website" | "section" | "job" | "price" | "pdf";
export type TrackerStatus = "active" | "paused" | "error";
export type ScanFrequency = "hourly" | "6h" | "12h" | "daily";
export type NotificationChannel = "email" | "telegram";
export type NotificationStatus = "pending" | "sent" | "failed";
export type SelectorType = "css" | "xpath";
export type ScanStatus = "success" | "failed";
export type EventSeverity = "low" | "medium" | "high";

export type EventType =
  | "content_added"
  | "content_removed"
  | "content_changed"
  | "price_drop"
  | "price_increase"
  | "new_job"
  | "pdf_updated";

// 1. users
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: UserPlan;
  provider: AuthProvider;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 2. preferences (users/{userId}/preferences/default)
export interface UserPreferences {
  theme: "dark" | "light" | "system";
  emailNotifications: boolean;
  telegramNotifications: boolean;
  telegramChatId?: string | null;
  defaultFrequency: ScanFrequency;
  timezone: string;
  updatedAt: Timestamp;
}

// 3. collections (users/{userId}/collections/{collectionId})
export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  trackerCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 4. trackers (trackers/{trackerId})
export interface Tracker {
  id: string;
  userId: string;
  collectionId?: string;
  name: string;
  description?: string;
  url: string;
  type: TrackerType;
  status: TrackerStatus;
  frequency: ScanFrequency;
  lastScanAt?: Timestamp;
  nextScanAt?: Timestamp;
  changeCount: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Type-specific embedded configurations to avoid multi-query roundtrips
  sectionConfig?: SectionTrackerConfig;
  jobConfig?: JobTrackerConfig;
  priceConfig?: PriceTrackerConfig;
  pdfConfig?: PdfTrackerConfig;
}

// 5. sectionTrackers config details
export interface SectionTrackerConfig {
  selector: string;
  selectorType: SelectorType;
  monitoredElement: string;
  createdAt: Timestamp;
}

// 6. jobTrackers config details
export interface JobTrackerConfig {
  role?: string;
  location?: string;
  remoteOnly: boolean;
  minExperience?: number;
  maxExperience?: number;
  keywords: string[];
}

// 7. priceTrackers config details
export interface PriceTrackerConfig {
  targetPrice?: number;
  currentPrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
  currency: string;
}

// 8. pdfTrackers config details
export interface PdfTrackerConfig {
  fileName: string;
  lastHash?: string;
  lastModified?: Timestamp;
}

// 9. snapshots (trackers/{trackerId}/snapshots/{snapshotId})
export interface Snapshot {
  id: string;
  trackerId: string;
  hash: string;
  content: string;
  contentLength: number;
  createdAt: Timestamp;
}

// 10. screenshots (trackers/{trackerId}/screenshots/{screenshotId})
export interface Screenshot {
  id: string;
  imageUrl: string;
  storagePath: string;
  width: number;
  height: number;
  createdAt: Timestamp;
}

// 11. scans (trackers/{trackerId}/scans/{scanId})
export interface ScanRecord {
  id: string;
  status: ScanStatus;
  responseTime: number;
  statusCode?: number;
  error?: string;
  changesDetected: boolean;
  scannedAt: Timestamp;
}

// 12. events (trackers/{trackerId}/events/{eventId})
export interface TrackerEvent {
  id: string;
  trackerId: string;
  type: EventType;
  title: string;
  summary: string;
  severity: EventSeverity;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
}

// 13. notifications (users/{userId}/notifications/{notificationId})
export interface NotificationLog {
  id: string;
  trackerId: string;
  eventId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  read: boolean;
  sentAt?: Timestamp;
  createdAt: Timestamp;
}

// 14. trackerTags (users/{userId}/tags/{tagId})
export interface TrackerTag {
  id: string;
  name: string;
  color: string;
  createdAt: Timestamp;
}

// 15. analytics (analytics/{userId})
export interface UserAnalytics {
  activeTrackers: number;
  totalScans: number;
  totalChanges: number;
  notificationsSent: number;
  successfulScans: number;
  failedScans: number;
  updatedAt: Timestamp;
}

// 16. trackerMetrics (trackers/{trackerId}/metrics/default)
export interface TrackerMetrics {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageResponseTime: number;
  changesDetected: number;
  lastUpdated: Timestamp;
}
