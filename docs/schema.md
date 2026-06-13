# schema.md

# Traxo Database Schema (Firebase Firestore)

Version: 1.0

---

# Database Overview

```text
users
│
├── collections
├── trackers
├── notifications
├── preferences
│
trackers
│
├── snapshots
├── events
├── scans
├── screenshots
│
marketplace
│
├── public_trackers
│
analytics
│
├── global_stats
```

---

# users

Stores user information.

Collection:

```text
users/{userId}
```

Schema:

```ts
{
  id: string
  email: string
  displayName: string
  photoURL?: string

  plan: "free" | "pro" | "business"

  provider: "google" | "email"

  emailVerified: boolean

  onboardingCompleted: boolean

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

# preferences

User settings.

Collection:

```text
users/{userId}/preferences/default
```

Schema:

```ts
{
  theme: "dark" | "light" | "system"

  emailNotifications: boolean

  telegramNotifications: boolean

  telegramChatId?: string

  defaultFrequency:
    | "hourly"
    | "6h"
    | "12h"
    | "daily"

  timezone: string

  updatedAt: Timestamp
}
```

---

# collections

Tracker groups.

Collection:

```text
users/{userId}/collections
```

Schema:

```ts
{
  id: string

  name: string

  description?: string

  color: string

  icon: string

  trackerCount: number

  createdAt: Timestamp

  updatedAt: Timestamp
}
```

Example:

```text
Placement Preparation
```

```text
Shopping Watchlist
```

---

# trackers

Main tracker collection.

Collection:

```text
trackers/{trackerId}
```

Schema:

```ts
{
  id: string

  userId: string

  collectionId?: string

  name: string

  description?: string

  url: string

  type:
    | "website"
    | "section"
    | "job"
    | "price"
    | "pdf"

  status:
    | "active"
    | "paused"
    | "error"

  frequency:
    | "hourly"
    | "6h"
    | "12h"
    | "daily"

  lastScanAt?: Timestamp

  nextScanAt?: Timestamp

  changeCount: number

  isPublic: boolean

  tags: string[]

  createdAt: Timestamp

  updatedAt: Timestamp
}
```

---

# sectionTrackers

Only for section tracking.

```ts
{
  trackerId: string

  selector: string

  selectorType:
    | "css"
    | "xpath"

  monitoredElement: string

  createdAt: Timestamp
}
```

Example:

```css
.notice-board
```

---

# jobTrackers

Job-specific settings.

```ts
{
  trackerId: string

  role?: string

  location?: string

  remoteOnly: boolean

  minExperience?: number

  maxExperience?: number

  keywords: string[]
}
```

---

# priceTrackers

Price monitoring.

```ts
{
  trackerId: string

  targetPrice?: number

  currentPrice?: number

  lowestPrice?: number

  highestPrice?: number

  currency: string
}
```

---

# pdfTrackers

PDF monitoring.

```ts
{
  trackerId: string

  fileName: string

  lastHash?: string

  lastModified?: Timestamp
}
```

---

# snapshots

Stores website versions.

Collection:

```text
trackers/{trackerId}/snapshots
```

Schema:

```ts
{
  id: string

  trackerId: string

  hash: string

  content: string

  contentLength: number

  createdAt: Timestamp
}
```

---

# screenshots

Visual diff support.

Collection:

```text
trackers/{trackerId}/screenshots
```

Schema:

```ts
{
  id: string

  imageUrl: string

  storagePath: string

  width: number

  height: number

  createdAt: Timestamp
}
```

---

# scans

Every monitoring execution.

Collection:

```text
trackers/{trackerId}/scans
```

Schema:

```ts
{
  id: string

  status:
    | "success"
    | "failed"

  responseTime: number

  statusCode?: number

  error?: string

  changesDetected: boolean

  scannedAt: Timestamp
}
```

---

# events

Detected changes.

Collection:

```text
trackers/{trackerId}/events
```

Schema:

```ts
{
  id: string

  trackerId: string

  type:
    | "content_added"
    | "content_removed"
    | "content_changed"
    | "price_drop"
    | "price_increase"
    | "new_job"
    | "pdf_updated"

  title: string

  summary: string

  severity:
    | "low"
    | "medium"
    | "high"

  metadata: object

  createdAt: Timestamp
}
```

Example:

```ts
{
  type: "price_drop",

  title: "MacBook Air Price Dropped",

  summary: "Price reduced by ₹5000"
}
```

---

# notifications

Notification history.

Collection:

```text
users/{userId}/notifications
```

Schema:

```ts
{
  id: string

  trackerId: string

  eventId: string

  channel:
    | "email"
    | "telegram"

  status:
    | "pending"
    | "sent"
    | "failed"

  read: boolean

  sentAt?: Timestamp

  createdAt: Timestamp
}
```

---

# trackerTags

Reusable tags.

Collection:

```text
users/{userId}/tags
```

Schema:

```ts
{
  id: string

  name: string

  color: string

  createdAt: Timestamp
}
```

Examples:

```text
Jobs
```

```text
Shopping
```

```text
College
```

---

# analytics

Per-user analytics.

Collection:

```text
analytics/{userId}
```

Schema:

```ts
{
  activeTrackers: number

  totalScans: number

  totalChanges: number

  notificationsSent: number

  successfulScans: number

  failedScans: number

  updatedAt: Timestamp
}
```

---

# trackerMetrics

Detailed tracker analytics.

Collection:

```text
trackers/{trackerId}/metrics
```

Schema:

```ts
{
  totalScans: number

  successfulScans: number

  failedScans: number

  averageResponseTime: number

  changesDetected: number

  lastUpdated: Timestamp
}
```

---

# publicTrackers

Marketplace (V2)

Collection:

```text
marketplace/publicTrackers
```

Schema:

```ts
{
  id: string

  creatorId: string

  name: string

  description: string

  category:
    | "jobs"
    | "prices"
    | "education"
    | "government"

  subscriberCount: number

  sourceUrl: string

  active: boolean

  createdAt: Timestamp
}
```

---

# subscriptions

Marketplace subscriptions.

Collection:

```text
users/{userId}/subscriptions
```

Schema:

```ts
{
  publicTrackerId: string

  subscribedAt: Timestamp
}
```

---

# billing

Future monetization.

Collection:

```text
billing/{userId}
```

Schema:

```ts
{
  customerId?: string

  subscriptionId?: string

  plan:
    | "free"
    | "pro"
    | "business"

  status:
    | "active"
    | "cancelled"
    | "expired"

  currentPeriodEnd?: Timestamp
}
```

---

# Firebase Storage Structure

```text
storage/
│
├── screenshots/
│   └── trackerId/
│
├── snapshots/
│   └── trackerId/
│
├── visual-diffs/
│   └── trackerId/
│
└── exports/
```

---

# Recommended Firestore Indexes

```text
trackers
  userId + status

trackers
  userId + type

events
  trackerId + createdAt

notifications
  userId + createdAt

marketplace
  category + subscriberCount
```

---

# Estimated MVP Collections

Core:

✅ users
✅ preferences
✅ collections
✅ trackers
✅ snapshots
✅ scans
✅ events
✅ notifications

Phase 2:

✅ screenshots
✅ analytics
✅ metrics

Phase 3:

✅ marketplace
✅ subscriptions
✅ billing
