# TRAXO - FINAL ADVANCED APPLICATION FLOW (NON-AI)

## Product Philosophy

Traxo is a monitoring platform that watches websites, jobs, prices, PDFs, and notices on behalf of users.

Users create trackers once.

Traxo continuously monitors and notifies them whenever meaningful changes occur.

---

# SYSTEM FLOW

```text
User
 ↓
Authentication
 ↓
Workspace
 ↓
Create Tracker
 ↓
Monitoring Engine
 ↓
Change Detection Engine
 ↓
Event Generator
 ↓
Notification Engine
 ↓
History & Analytics
 ↓
User
```

---

# 1. LANDING PAGE FLOW

```text
Landing Page
 │
 ├── Features
 ├── Pricing
 ├── Documentation
 ├── Login
 └── Start Tracking
```

---

## Hero Section

Headline:

Never Miss What Matters.

Subheadline:

Track websites, jobs, prices, PDFs, and notices automatically.

CTA:

* Start Tracking Free
* View Demo

---

# 2. AUTHENTICATION FLOW

```text
Login
 │
 ├── Email + Password
 └── Google Login
```

↓

Successful Login

↓

Check User

```text
Existing User?
 │
 ├── Yes → Dashboard
 └── No → Onboarding
```

---

# 3. ONBOARDING FLOW

## Step 1

Welcome Screen

↓

Ask:

What would you like to monitor?

Options:

* Website Updates
* Job Openings
* Product Prices
* PDFs
* College Notices

---

## Step 2

Create First Tracker

User enters URL

Example:

```text
https://careers.google.com
```

---

## Step 3

Choose Tracking Type

```text
Entire Website
Specific Section
Job Tracking
Price Tracking
PDF Tracking
```

---

## Step 4

Select Notification Method

```text
Email
Telegram
```

---

## Step 5

Tracker Created

↓

Redirect to Dashboard

---

# 4. DASHBOARD FLOW

Dashboard is the control center.

---

## Top Statistics

```text
Active Trackers

Total Updates

Notifications Sent

Changes Today
```

---

## Recent Activity Feed

```text
New Internship Added

Price Dropped

PDF Updated

Notice Published
```

---

## Quick Actions

```text
+ Create Tracker

Collections

History

Analytics
```

---

# 5. TRACKER CREATION FLOW

User clicks:

```text
+ Create Tracker
```

---

## Step 1

Enter URL

```text
https://amazon.in
```

---

## Step 2

Choose Tracker Type

```text
Website

Section

Job

Price

PDF
```

---

## Step 3

Configure Tracker

---

### Website Tracker

Monitor:

Entire Page

---

### Section Tracker

Select Element

```css
.notice-board
```

or

```css
.job-listings
```

---

### Price Tracker

Monitor:

```text
Current Price
Availability
Discount
```

Optional:

```text
Notify below ₹50,000
```

---

### Job Tracker

Monitor:

```text
Role
Location
Experience
```

---

### PDF Tracker

Monitor:

```text
PDF URL
```

---

## Step 4

Select Frequency

```text
Every Hour

Every 6 Hours

Every 12 Hours

Daily
```

---

## Step 5

Save Tracker

↓

Monitoring Starts

---

# 6. COLLECTION FLOW

Collections organize trackers.

---

Example:

```text
Placement Preparation
```

Contains:

```text
Google Careers

Microsoft Careers

Amazon Jobs
```

---

Example:

```text
Shopping Watchlist
```

Contains:

```text
iPhone

MacBook

PlayStation
```

---

# 7. MONITORING ENGINE FLOW

Cloudflare Cron Trigger

↓

Cloudflare Queue

↓

Tracker Processor

↓

Fetch Content

↓

Normalize Content

↓

Generate Snapshot

↓

Compare Snapshot

↓

Changes Found?

```text
No
 ↓
End
```

or

```text
Yes
 ↓
Create Event
 ↓
Store History
 ↓
Send Notification
```

---

# 8. CHANGE DETECTION FLOW

Previous Snapshot

↓

Current Snapshot

↓

Diff Engine

↓

Detect:

```text
Added Content

Removed Content

Modified Content
```

↓

Generate Change Record

↓

Store In Database

---

# 9. EVENT GENERATION FLOW

Raw Change

↓

Rule Engine

↓

Generate Event

---

Examples

### Website Update

```diff
+ New Notice Added
```

↓

Event:

```text
Notice Published
```

---

### Price Change

```text
₹80,000
```

↓

```text
₹75,000
```

↓

Event:

```text
Price Dropped ₹5,000
```

---

### PDF Change

Hash Changed

↓

Event:

```text
PDF Updated
```

---

### Job Change

New Listing Appears

↓

Event:

```text
New Job Posted
```

---

# 10. NOTIFICATION FLOW

Event Created

↓

Notification Engine

↓

User Preferences

↓

Send Notification

---

## Email Alert

```text
New Internship Posted

Company:
Google

Location:
Bangalore
```

---

## Telegram Alert

```text
Price Dropped

MacBook Air M4

₹94,999 → ₹89,999
```

---

# 11. HISTORY FLOW

Every event stored permanently.

---

Timeline Example

```text
Today

Google Internship Added

2 Hours Ago

Price Dropped

Yesterday

Scholarship Notice Published
```

---

Features:

```text
Search

Filter

Sort

Export
```

---

# 12. VISUAL DIFF FLOW

Capture Screenshot

↓

Store Screenshot

↓

Next Scan

↓

Capture Screenshot

↓

Compare Images

↓

Highlight Changes

---

User View

```text
Before

After

Highlighted Differences
```

---

# 13. ANALYTICS FLOW

Analytics Dashboard

---

## Website Activity

Shows:

```text
Updates Per Day

Updates Per Month

Most Active Websites
```

---

## Tracker Performance

Shows:

```text
Successful Scans

Failed Scans

Last Scan Time
```

---

## Notification Analytics

Shows:

```text
Notifications Sent

Delivered

Opened
```

---

# 14. SETTINGS FLOW

Profile

↓

Notification Settings

↓

Default Tracker Settings

↓

Billing

↓

API Tokens (Future)

---

# 15. PUBLIC TRACKER MARKETPLACE (V2)

Marketplace

↓

Browse Public Trackers

Examples:

```text
Google Careers

Amazon Jobs

VSSUT Notices

Apple Price Tracker
```

↓

Subscribe

↓

Tracker Added Automatically

---

# 16. FUTURE API PLATFORM (V3)

Developers can:

```text
Create Tracker

Fetch Events

Fetch Tracker History

Generate Reports
```

---

# FINAL NAVIGATION STRUCTURE

```text
/
├── Landing
├── Login
├── Register
├── Onboarding
├── Dashboard
│
├── Trackers
│   ├── Create
│   ├── Edit
│   ├── Details
│   └── Visual Diff
│
├── Collections
│
├── History
│
├── Analytics
│
├── Notifications
│
├── Settings
│
├── Billing
│
├── Marketplace (V2)
│
└── API Platform (V3)
```

# MVP RELEASE MODULES


* Authentication
* Dashboard
* Website Tracking
* Section Tracking
* PDF Tracking
* Job Tracking
* Price Tracking
* Email Notifications
* Telegram Notifications
* History

* Collections
* Visual Diff
* Analytics
* Advanced Filters

* Public Tracker Marketplace
* API Platform
* Team Workspaces

This architecture is scalable, works perfectly with Firebase + Cloudflare, and can support thousands of users without requiring a major rewrite later.
