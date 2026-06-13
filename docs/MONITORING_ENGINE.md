# MONITORING_ENGINE.md

# Traxo Monitoring Engine Specification

Version: 1.0

---

# Purpose

The Monitoring Engine is the core of Traxo.

Its responsibility is to:

* Fetch content
* Extract relevant information
* Compare versions
* Detect changes
* Generate events
* Trigger notifications

Every tracker in Traxo eventually passes through this engine.

---

# Monitoring Pipeline

```text
Tracker
   │
   ▼
Validation
   │
   ▼
Fetch
   │
   ▼
Extract
   │
   ▼
Normalize
   │
   ▼
Hash
   │
   ▼
Compare
   │
   ▼
Generate Event
   │
   ▼
Store Snapshot
   │
   ▼
Send Notification
```

---

# Tracker Types

Supported Types

```ts
type TrackerType =
  | "website"
  | "section"
  | "job"
  | "price"
  | "pdf";
```

---

# URL Validation

Before any tracker is created:

Validate:

* URL format
* Protocol
* Reachability

Accepted:

```text
https://example.com
https://careers.google.com
https://amazon.in
```

Rejected:

```text
javascript:
file:
ftp:
localhost:
127.0.0.1
```

---

# Monitoring Service Architecture

```text
services/
│
├── monitoring/
│   ├── engine.ts
│   ├── scheduler.ts
│   ├── dispatcher.ts
│
├── scraping/
│   ├── website.ts
│   ├── section.ts
│   ├── price.ts
│   ├── job.ts
│   ├── pdf.ts
│
├── hashing/
│   ├── hash.ts
│
├── comparison/
│   ├── diff.ts
│
├── events/
│   ├── generator.ts
│
└── notifications/
```

---

# Fetch Layer

Goal:

Retrieve page content.

---

# Method Selection

Static Website

↓

Cheerio

---

Dynamic Website

↓

Playwright

---

Detection:

If JS rendering required

↓

Use Playwright

Else

↓

Use Cheerio

---

# Request Configuration

User Agent:

```text
Mozilla/5.0
TraxoBot/1.0
```

---

Timeout

```ts
15000
```

milliseconds

---

Retries

```ts
3
```

attempts

---

# Retry Strategy

Attempt 1

↓

1 minute

↓

Attempt 2

↓

5 minutes

↓

Attempt 3

↓

Fail

---

# Content Extraction

Goal:

Remove noise.

Keep meaningful content.

---

# Remove

Always strip:

* Scripts
* Styles
* Ads
* Analytics tags
* Cookie banners
* Dynamic timestamps
* Session IDs

---

Example

Remove:

```html
<script>
```

Remove:

```html
<style>
```

Remove:

```html
.cookie-banner
```

---

# Website Tracking

Process

```text
Fetch HTML
 ↓
Normalize
 ↓
Hash
 ↓
Compare
```

Track:

* Text
* Links
* Tables
* Lists

---

# Section Tracking

User provides:

```css
.notice-board
```

or

```css
.job-list
```

Process

```text
HTML
 ↓
Selector
 ↓
Element
 ↓
Snapshot
 ↓
Compare
```

Only selected element is monitored.

---

# Price Tracking

Goal:

Detect price changes.

---

Extraction

Identify:

```text
₹49999
```

or

```text
$499
```

Store:

```ts
{
  currentPrice: 49999
}
```

---

Comparison

Old Price

↓

New Price

↓

Generate Event

---

Events

```ts
price_drop
price_increase
```

---

# Job Tracking

Goal:

Detect new openings.

---

Keywords

```ts
[
 "job",
 "career",
 "opening",
 "position",
 "internship",
 "apply"
]
```

---

Detection

New listing appears

↓

Create event

```ts
new_job
```

---

Track

* Role
* Location
* Experience
* Apply URL

---

# PDF Tracking

Process

```text
Download PDF
 ↓
Generate Hash
 ↓
Compare
```

Hash changed

↓

Generate Event

```ts
pdf_updated
```

---

Store

* fileName
* fileSize
* hash

---

# Content Normalization

Purpose:

Reduce false positives.

---

Normalize:

Whitespace

```text
Multiple spaces
```

↓

Single space

---

Remove:

```text
Generated at 10:01
```

```text
Generated at 10:02
```

These should not trigger updates.

---

# Hash Generation

Algorithm

```ts
SHA-256
```

---

Hash Input

Normalized content.

---

Output

```text
e7f4a4b...
```

---

# Snapshot Storage

Collection

```text
snapshots/
```

Store:

```ts
{
  hash,
  content,
  createdAt
}
```

---

# Diff Engine

Purpose:

Identify actual changes.

---

Detect

Added

```diff
+ Internship Open
```

Removed

```diff
- Applications Closed
```

Modified

```diff
Old Deadline
New Deadline
```

---

# Change Classification

Types

```ts
content_added
content_removed
content_changed
price_drop
price_increase
new_job
pdf_updated
```

---

# Event Generation

Output

```ts
{
  type: "price_drop",
  title: "Price Dropped",
  summary: "Price decreased by ₹5000"
}
```

---

Store

```text
events/
```

---

# Event Severity

Low

Examples:

* Minor text edits

---

Medium

Examples:

* New notice

---

High

Examples:

* Price drop
* New internship
* PDF updated

---

# Queue Processing

Cloudflare Queue Message

```ts
{
  trackerId,
  userId
}
```

---

Worker Flow

```text
Receive Job
 ↓
Fetch Tracker
 ↓
Run Monitoring
 ↓
Store Results
 ↓
Complete
```

---

# Failure Handling

Failures

* Timeout
* DNS Failure
* Rate Limit
* Parsing Failure

---

Store

```text
scans/
```

record

---

# Scan Status

```ts
success
failed
partial
```

---

# Rate Limiting

Per Domain

Example

```text
amazon.in
```

Limit

```ts
1 request / minute
```

---

Prevent:

* IP bans
* Captchas

---

# Monitoring Frequency

Supported

```ts
hourly
6h
12h
daily
```

---

Managed by:

Cloudflare Cron Triggers

---

# Screenshot Monitoring

Phase 2

Playwright

↓

Capture Screenshot

↓

Store

↓

Compare

↓

Generate Visual Diff

---

Storage

Firebase Storage

---

# Notification Trigger

Event Created

↓

Notification Service

↓

Email

or

↓

Telegram

---

# Performance Targets

Monitoring Execution

```ts
< 10 seconds
```

per tracker

---

Hash Generation

```ts
< 100ms
```

---

Queue Processing

```ts
< 2 seconds
```

---

# Scalability Strategy

Current

```text
10,000 trackers
```

---

Future

```text
1,000,000+ trackers
```

Methods

* Queue processing
* Domain throttling
* Snapshot compression
* Parallel workers

---

# Security Rules

Never fetch:

```text
localhost
127.0.0.1
10.x.x.x
172.x.x.x
192.168.x.x
```

Prevent SSRF attacks.

---

Validate:

* URLs
* Selectors
* User input

before processing.

---

# Logging

Every scan creates:

```ts
{
  trackerId,
  startTime,
  endTime,
  status,
  changesDetected
}
```

---

# Monitoring Success Criteria

A scan is successful when:

* Website fetched
* Content extracted
* Hash generated
* Snapshot stored
* Event generated if needed

---

# Final Principle

The Monitoring Engine must prioritize:

1. Accuracy
2. Reliability
3. Scalability
4. Cost Efficiency
5. Performance

False positives are worse than missing insignificant changes.

Only meaningful updates should generate user notifications.
