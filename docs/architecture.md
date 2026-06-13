# ARCHITECTURE.md

# Traxo System Architecture

Version: 1.0

---

# Overview

Traxo is built using an Edge-First Serverless Architecture.

Goals:

* Global performance
* High scalability
* Low operational cost
* No server management
* Fast monitoring execution

---

# High Level Architecture

```text
                    ┌─────────────────┐
                    │     User        │
                    └────────┬────────┘
                             │
                             ▼
               ┌──────────────────────────┐
               │ Cloudflare Pages (UI)    │
               └─────────────┬────────────┘
                             │
                             ▼
              ┌───────────────────────────┐
              │ Cloudflare Workers API    │
              └──────┬──────────┬─────────┘
                     │          │
                     │          │
                     ▼          ▼

          ┌────────────────┐  ┌────────────────┐
          │ Firestore DB   │  │ Firebase Auth  │
          └────────────────┘  └────────────────┘

                     │
                     ▼

           ┌──────────────────────┐
           │ Cloudflare Queues    │
           └──────────┬───────────┘
                      │
                      ▼

          ┌────────────────────────┐
          │ Monitoring Workers     │
          └──────────┬─────────────┘
                     │
                     ▼

          ┌────────────────────────┐
          │ Playwright/Cheerio     │
          └──────────┬─────────────┘
                     │
                     ▼

          ┌────────────────────────┐
          │ Snapshot Comparison    │
          └──────────┬─────────────┘
                     │
                     ▼

          ┌────────────────────────┐
          │ Event Generation       │
          └──────────┬─────────────┘
                     │
                     ▼

          ┌────────────────────────┐
          │ Notification Engine    │
          └──────────┬─────────────┘
                     │
          ┌──────────┴───────────┐
          ▼                      ▼

      Email                  Telegram
```

---

# System Layers

## Layer 1

Presentation Layer

Responsibilities:

* UI
* Authentication
* Dashboard
* Analytics
* Settings

Technology:

* Next.js
* Tailwind
* Shadcn UI

Deployment:

Cloudflare Pages

---

## Layer 2

API Layer

Responsibilities:

* CRUD operations
* Authentication verification
* Tracker management
* Event retrieval
* Analytics retrieval

Technology:

Cloudflare Workers

---

## Layer 3

Data Layer

Responsibilities:

* User storage
* Tracker storage
* Events
* Notifications

Technology:

Firestore

---

## Layer 4

Monitoring Layer

Responsibilities:

* Website fetching
* DOM extraction
* Price monitoring
* PDF monitoring

Technology:

* Playwright
* Cheerio

---

## Layer 5

Notification Layer

Responsibilities:

* Email delivery
* Telegram delivery
* Digest generation

---

# Monitoring Pipeline

Core business process.

```text
Tracker
   │
   ▼
Fetch Website
   │
   ▼
Extract Content
   │
   ▼
Normalize Content
   │
   ▼
Generate Hash
   │
   ▼
Compare Snapshot
   │
   ▼
Changes Found?
   │
 ┌─┴───────┐
 │         │
No        Yes
 │         │
 ▼         ▼
End    Generate Event
             │
             ▼
     Send Notification
```

---

# Tracker Lifecycle

## Step 1

User Creates Tracker

Stored in:

```text
trackers/
```

---

## Step 2

Cron Trigger Detects Schedule

Example:

```text
Hourly Scan
```

---

## Step 3

Job Added To Queue

Queue Message:

```json
{
  "trackerId": "abc123"
}
```

---

## Step 4

Worker Consumes Job

Loads tracker.

Fetches website.

---

## Step 5

Snapshot Created

Example:

```text
HTML Content
```

↓

Generate SHA256 Hash

---

## Step 6

Compare With Previous Snapshot

```text
Previous Hash
```

↓

```text
Current Hash
```

---

## Step 7

Changes Detected

Create Event.

---

## Step 8

Notification Sent.

---

# Website Tracking Architecture

```text
Website URL
     │
     ▼
HTTP Request
     │
     ▼
HTML Content
     │
     ▼
Cheerio Parser
     │
     ▼
Extract Relevant Data
     │
     ▼
Snapshot
```

---

# Section Tracking Architecture

```text
HTML
 │
 ▼
CSS Selector
 │
 ▼
Extract Element
 │
 ▼
Snapshot
 │
 ▼
Compare
```

Example:

```css
.notice-board
```

---

# Price Tracking Architecture

```text
Product Page
      │
      ▼
Extract Price
      │
      ▼
Store Price
      │
      ▼
Compare Price
      │
      ▼
Price Event
```

Events:

* Price Drop
* Price Increase

---

# PDF Tracking Architecture

```text
PDF URL
    │
    ▼
Download PDF
    │
    ▼
Generate Hash
    │
    ▼
Compare
    │
    ▼
PDF Updated Event
```

---

# Visual Diff Architecture

Phase 2

```text
Playwright
    │
    ▼
Take Screenshot
    │
    ▼
Store Screenshot
    │
    ▼
Compare Images
    │
    ▼
Highlight Changes
```

Storage:

Firebase Storage

---

# Notification Architecture

```text
Event Created
     │
     ▼
Notification Service
     │
     ▼
User Preferences
     │
     ▼
Channel Routing
```

---

Email

```text
Event
 ↓
Resend
 ↓
User
```

---

Telegram

```text
Event
 ↓
Telegram Bot
 ↓
User
```

---

# Queue Architecture

Cloudflare Queues

Purpose:

* Prevent API overload
* Retry failed scans
* Scale monitoring

---

Queue Message

```json
{
  "trackerId": "abc123",
  "userId": "user123"
}
```

---

# Retry Strategy

```text
Attempt 1

↓

Attempt 2 (1 min)

↓

Attempt 3 (5 min)

↓

Attempt 4 (15 min)

↓

Fail
```

Store error log.

---

# Analytics Architecture

Metrics Collected

* Total scans
* Total trackers
* Total events
* Successful scans
* Failed scans

---

Data Sources

```text
Trackers
Scans
Events
Notifications
```

↓

Aggregated

↓

Analytics Dashboard

---

# Security Architecture

## Authentication

Firebase Auth

---

## Authorization

Every request verifies:

```text
request.user.id
```

matches

```text
resource.userId
```

---

## Firestore Rules

Users only access:

* Their trackers
* Their events
* Their notifications

---

## API Protection

Cloudflare Rate Limiting

---

## Bot Protection

Cloudflare Turnstile

---

# Logging Architecture

All services use centralized logging.

Structure:

```json
{
  "service": "monitoring",
  "trackerId": "123",
  "event": "scan_started",
  "timestamp": "..."
}
```

---

# Error Handling Architecture

All errors are classified.

Types:

* Network Error
* Parsing Error
* Authentication Error
* Notification Error

---

Store:

```text
scans/
```

for debugging.

---

# Deployment Architecture

Frontend

```text
Cloudflare Pages
```

---

Backend

```text
Cloudflare Workers
```

---

Database

```text
Firestore
```

---

Storage

```text
Firebase Storage
```

---

Notifications

```text
Resend
Telegram
```

---

# Scalability Strategy

Current Target

```text
10,000 users
```

---

Future Target

```text
100,000+ users
```

Scaling Methods:

* More queue consumers
* Worker autoscaling
* Firestore indexes
* Cached analytics
* Batched notifications

---

# Future Architecture

Phase 2

* Visual Diff Service
* Analytics Engine
* Collections Engine

---

Phase 3

* Public Marketplace
* Public Tracker Subscriptions
* Team Workspaces

---

Phase 4

* Browser Extension
* PWA
* Webhook Platform
* Public API

---

# Architectural Principles

1. Edge First
2. Serverless First
3. Event Driven
4. Queue Based Processing
5. Strongly Typed
6. Secure By Default
7. Observable Systems
8. Performance Focused
9. Modular Services
10. Horizontal Scalability

---

# Final Architecture Goal

Traxo should be capable of monitoring millions of webpages and delivering updates globally with minimal latency while maintaining a premium user experience.
