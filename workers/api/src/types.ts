export type Bindings = {
  FIREBASE_PROJECT_ID: string;
  NEXT_JS_API_URL: string;
  INTERNAL_API_SECRET: string;
  SCANS_QUEUE?: {
    send(message: any, options?: { delaySeconds?: number }): Promise<void>;
    sendBatch(messages: Iterable<{ body: any; delaySeconds?: number }>): Promise<void>;
  };
};

export type Variables = {
  userId: string;
  userEmail?: string;
};

// Database Model Alignments (cloned from core schema for edge runtime portability)
export type UserPlan = "free" | "pro" | "business";
export type AuthProvider = "google" | "email";
export type TrackerType = "website" | "section" | "job" | "price" | "pdf";
export type TrackerStatus = "active" | "paused" | "error";
export type ScanFrequency = "30m" | "hourly" | "3h" | "6h" | "12h" | "daily";
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
  lastScanAt?: string; // Stored as ISO string in REST API
  nextScanAt?: string;
  changeCount: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sectionConfig?: SectionTrackerConfig;
  jobConfig?: JobTrackerConfig;
  priceConfig?: PriceTrackerConfig;
  pdfConfig?: PdfTrackerConfig;
}

export interface SectionTrackerConfig {
  selector: string;
  selectorType: SelectorType;
  monitoredElement: string;
  createdAt?: string;
}

export interface JobTrackerConfig {
  role?: string;
  location?: string;
  remoteOnly: boolean;
  minExperience?: number;
  maxExperience?: number;
  keywords: string[];
}

export interface PriceTrackerConfig {
  targetPrice?: number;
  currentPrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
  currency: string;
}

export interface PdfTrackerConfig {
  fileName: string;
  lastHash?: string;
  lastModified?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  trackerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  trackerId: string;
  hash: string;
  content: string;
  contentLength: number;
  createdAt: string;
}

export interface ScanRecord {
  id: string;
  status: ScanStatus;
  responseTime: number;
  statusCode?: number;
  error?: string;
  changesDetected: boolean;
  scannedAt: string;
}

export interface TrackerEvent {
  id: string;
  trackerId: string;
  type: EventType;
  title: string;
  summary: string;
  severity: EventSeverity;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  trackerId: string;
  eventId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  read: boolean;
  sentAt?: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  emailNotifications: boolean;
  telegramNotifications: boolean;
  telegramChatId?: string;
  defaultFrequency: ScanFrequency;
  timezone: string;
  updatedAt: string;
}

export interface UserAnalytics {
  activeTrackers: number;
  totalScans: number;
  totalChanges: number;
  notificationsSent: number;
  successfulScans: number;
  failedScans: number;
  updatedAt: string;
}

export interface TrackerMetrics {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageResponseTime: number;
  changesDetected: number;
  lastUpdated: string;
}
