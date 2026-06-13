# Trackly

## Intelligent Website Monitoring & Change Detection Platform

Version: 1.0 (MVP)
Status: Product Requirements Document (PRD)

---

# 1. Vision

Trackly helps users monitor websites, specific webpage sections, product prices, job portals, PDFs, and notices automatically.

Instead of manually checking websites every day, users receive meaningful notifications whenever something important changes.

Trackly does not simply tell users that a website changed.

Trackly tells users:

* What changed
* Where it changed
* Why it matters

---

# 2. Problem Statement

People repeatedly visit websites to check:

* College notices
* Job openings
* Internship opportunities
* Product prices
* Scholarship announcements
* Government portals
* Research publications

This causes:

* Time waste
* Missed opportunities
* Information overload
* Poor productivity

Most existing trackers provide noisy alerts and poor change visibility.

---

# 3. Goals

## Primary Goals

* Automated website monitoring
* Accurate change detection
* Instant notifications
* Reduced manual checking

## Secondary Goals

* Job opportunity monitoring
* Product price tracking
* Productivity-focused organization
* Change analytics

---

# 4. Target Audience

## Students

Track:

* College notices
* Results
* Scholarships
* Timetables

---

## Job Seekers

Track:

* Career pages
* Internship portals
* Hiring announcements

---

## Shoppers

Track:

* Product prices
* Discounts
* Availability

---

## Researchers

Track:

* Journals
* Publications
* Government updates

---

# 5. Core Features

---

# Feature 1: Smart Change Detection

## Text Change Detection

Detect:

* Added content
* Removed content
* Modified content

Example:

```diff
+ New Internship Notice Added
+ Deadline: July 10

- Previous Internship Closed
```

---

## PDF Monitoring

Monitor:

* Results PDFs
* Timetables
* Government documents
* Research papers

Notify when:

* File updated
* File replaced
* New PDF added
* PDF removed

---

## Image Change Detection

Detect changes in:

* Product images
* Notice images
* Website banners
* Promotional graphics

---

## Snapshot Comparison

Store historical versions.

Provide:

* Previous version
* Current version
* Difference visualization

---

# Feature 2: Section-Based Tracking

Track only selected sections.

Examples:

* Notice Board
* Careers Section
* Pricing Table
* Scholarship List
* Product Availability

Benefits:

* Less noise
* Higher accuracy
* Faster monitoring
* Lower infrastructure costs

---

# Feature 3: Notification System

## Instant Alerts

Example:

```text
🚨 New Internship Posted

Company: Infosys
Deadline: June 30
```

---

## Daily Digest

Example:

```text
Today's Updates

• 3 notices added
• 2 prices dropped
• 1 internship posted
```

---

## Weekly Digest

Example:

```text
This Week

18 updates detected
7 important updates
```

---

## Notification Channels

### MVP

* Email
* Telegram

### Future

* Discord
* Slack
* WhatsApp

---

# Feature 4: Price Monitoring

Monitor:

* Product price
* Discount percentage
* Stock availability

Supported Categories:

* Smartphones
* Laptops
* Electronics
* Gaming Consoles
* Software subscriptions

Example:

```text
Price Dropped

iPhone 17

₹89,999 → ₹84,999
```

---

# Feature 5: Job Tracking

Track:

* Company career pages
* Internship portals
* Startup hiring pages

Examples:

* Google Careers
* Microsoft Careers
* Amazon Jobs

---

## Filters

Users can monitor specific roles:

* Software Engineer
* Frontend Developer
* Data Analyst

Additional Filters:

* Remote
* Hybrid
* Onsite
* Experience level

---

# Feature 6: Productivity Features

## Bookmark + Monitor

Save websites while automatically monitoring them.

---

## Tags

Examples:

* Jobs
* College
* Shopping
* Research

---

## Collections

Examples:

### Placement Preparation

* Google Careers
* Microsoft Careers
* Amazon Careers

### Shopping Watchlist

* Laptop
* Smartphone
* Accessories

---

## Notes

Attach personal notes to trackers.

Example:

```text
Apply before June 15
```

---

# Feature 7: Analytics Dashboard

## Change Frequency

Display website activity trends.

Example:

```text
June: 15 Updates
July: 28 Updates
August: 7 Updates
```

---

## Most Active Websites

Rank tracked websites by activity.

---

## Update Calendar

GitHub-style activity heatmap.

---

## Tracker Statistics

Show:

* Total trackers
* Total updates
* Notifications sent
* Price drops detected
* Job opportunities detected

---

# Feature 8: Smart Monitoring Templates

## Student Template

Includes:

* College notices
* Results
* Scholarships

---

## Job Hunter Template

Includes:

* Career pages
* Internship portals
* Hiring announcements

---

## Deal Hunter Template

Includes:

* Product prices
* Flash sales
* Discount monitoring

---

# 6. User Flow

1. User signs up
2. User creates tracker
3. User selects tracking type
4. User selects section or entire page
5. Monitoring starts
6. Change detected
7. Notification sent
8. User reviews update
9. Analytics updated

---

# 7. Technical Architecture

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

---

## Authentication

Firebase Authentication

Providers:

* Email/Password
* Google

---

## Database

Firebase Firestore

Collections:

* users
* trackers
* snapshots
* changes
* notifications
* collections
* tags

---

## Storage

Firebase Storage

Used for:

* Screenshots
* PDFs
* Website snapshots
* Historical archives

---

## Monitoring Engine

* Playwright
* Cheerio

Responsibilities:

* Website scraping
* Price extraction
* PDF monitoring
* Job tracking

---

## Backend

Cloudflare Workers

Responsibilities:

* APIs
* Monitoring logic
* Notification processing
* Tracker management

---

## Scheduling

Cloudflare Cron Triggers

Responsibilities:

* Scheduled scans
* Tracker execution

---

## Queue System

Cloudflare Queues

Responsibilities:

* Scan processing
* Notification dispatching
* Background tasks

---

## Product URL

https://traxo.alokkumarsahu.in

---

## Notifications

### Email

* SMTP
* Resend (optional)

### Telegram

* Telegram Bot API

---

## Analytics

* Firebase Analytics
* Cloudflare Analytics

---

## Deployment

### Frontend

Cloudflare Pages

### Backend

Cloudflare Workers

### CDN

Cloudflare Edge Network

---

# 8. Database Collections

## users

* id
* email
* plan
* createdAt

---

## trackers

* id
* userId
* url
* name
* type
* frequency
* sectionSelector

---

## snapshots

* id
* trackerId
* contentHash
* snapshotData
* createdAt

---

## changes

* id
* trackerId
* changeType
* summary
* createdAt

---

## notifications

* id
* userId
* trackerId
* channel
* status

---

# 9. Pricing

## Free

* 5 trackers
* Daily scans
* Email alerts

---

## Pro

₹99/month

* 100 trackers
* Hourly scans
* Telegram alerts
* Analytics dashboard

---

## Business

₹299/month

* Unlimited trackers
* Priority scanning
* Team access
* API access

---

# 10. Success Metrics

Month 1

* 100 users
* 500 trackers

Month 3

* 1,000 users
* 10,000 trackers

Month 6

* 5,000 users
* 50,000 trackers

---

# 11. Future Roadmap (Post-MVP)

* AI change summaries
* AI importance scoring
* Visual screenshot diff
* Competitor monitoring
* Public tracker marketplace
* Team collaboration
* API access
* Browser extension
* Progressive Web App (PWA)

---

# 12. Unique Selling Proposition

Traditional Trackers:

"This webpage changed."

Trackly:

"An internship was added for Software Engineers. Deadline: July 10. Apply now."

The product focuses on actionable insights rather than raw change notifications.
