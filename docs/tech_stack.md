# TECH_STACK.md

# Traxo Technology Stack

Version: 1.0

---

# Overview

Traxo is designed as a modern serverless SaaS platform optimized for:

* Scalability
* Performance
* Low infrastructure costs
* Developer productivity
* Cloudflare Edge deployment

The architecture is built to support:

* Thousands of users
* Millions of scans
* Global deployment
* Real-time notifications

without managing traditional servers.

---

# Frontend Stack

## Framework

### Next.js 15

Purpose:

* App Router
* Server Components
* SEO
* Routing
* Performance

---

## Language

### TypeScript

Configuration:

```json id="b0fq90"
{
  "strict": true
}
```

Purpose:

* Type safety
* Scalability
* Better DX

---

## Styling

### Tailwind CSS

Purpose:

* Utility-first styling
* Rapid development
* Design consistency

---

### Tailwind Merge

Purpose:

* Resolve class conflicts

---

### Class Variance Authority (CVA)

Purpose:

* Component variants
* Design system consistency

---

## Component Library

### Shadcn UI

Purpose:

* Accessible components
* Fully customizable
* Modern design system

---

### Radix UI

Purpose:

* Dialogs
* Menus
* Tooltips
* Popovers
* Accessibility primitives

---

## Icons

### Lucide React

Purpose:

* Consistent iconography
* Tree-shakeable

---

## Forms

### React Hook Form

Purpose:

* Form management
* Validation

---

### Zod

Purpose:

* Schema validation
* Type-safe forms

---

# Animation Stack

## Framer Motion

Purpose:

* Page transitions
* Card animations
* Timeline animations
* Microinteractions

---

## Motion One

Purpose:

* Lightweight motion effects

---

## Lenis

Purpose:

* Smooth scrolling

---

## React Three Fiber (Optional)

Purpose:

* Premium landing page effects
* 3D visualizations

---

# State Management

## Zustand

Purpose:

* Global state

Examples:

* UI state
* Sidebar state
* Theme state

---

## TanStack Query

Purpose:

* Server state
* Caching
* Background refetching

---

# Backend Stack

## Runtime

### Cloudflare Workers

Purpose:

* API layer
* Edge execution
* Monitoring services
* Notifications

Benefits:

* Low latency
* Serverless
* Auto scaling

---

## Queue Processing

### Cloudflare Queues

Purpose:

* Monitoring jobs
* Notification processing
* Retry handling

---

## Scheduled Tasks

### Cloudflare Cron Triggers

Purpose:

* Hourly scans
* Daily scans
* Scheduled maintenance

---

# Database Stack

## Database

### Firebase Firestore

Purpose:

* User data
* Trackers
* Events
* Notifications
* Analytics

Benefits:

* Real-time
* Managed infrastructure
* Automatic scaling

---

## Storage

### Firebase Storage

Purpose:

* Screenshots
* Visual diffs
* PDF archives
* Snapshot exports

---

# Authentication Stack

## Firebase Authentication

Providers:

* Email/Password
* Google Login

Future:

* GitHub Login

---

Purpose:

* User authentication
* Session management

---

# Monitoring Stack

## Playwright

Purpose:

* Dynamic websites
* Screenshot capture
* Visual diff generation

Use Cases:

* SPA monitoring
* Price monitoring
* Job monitoring

---

## Cheerio

Purpose:

* HTML parsing
* Content extraction

Use Cases:

* Website tracking
* Section tracking

---

## DOM Comparison Engine

Purpose:

* Snapshot comparison
* Change detection

Features:

* Added content
* Removed content
* Modified content

---

# Notification Stack

## Email

### Resend

Purpose:

* Transactional emails
* Alerts
* Digests

---

## Telegram

### Telegram Bot API

Purpose:

* Real-time notifications

---

Future:

* Discord
* Slack
* WhatsApp

---

# Analytics Stack

## Recharts

Purpose:

* Dashboard analytics
* Trend charts
* Activity charts

---

## Firebase Analytics

Purpose:

* User analytics
* Usage tracking

---

## Cloudflare Analytics

Purpose:

* Infrastructure monitoring
* Traffic analytics

---

# Logging & Monitoring

## Sentry

Purpose:

* Error monitoring
* Performance tracking

---

## Cloudflare Logs

Purpose:

* Worker logs
* API monitoring

---

# Testing Stack

## Vitest

Purpose:

* Unit testing

---

## Testing Library

Purpose:

* Component testing

---

## Playwright

Purpose:

* End-to-end testing

---

# Validation Stack

## Zod

Purpose:

* Request validation
* Form validation
* API validation

---

# Security Stack

## Firebase Security Rules

Purpose:

* Database security

---

## Cloudflare Turnstile

Purpose:

* Bot protection
* Signup protection

---

## Rate Limiting

Implemented via:

Cloudflare Workers

Purpose:

* API protection
* Abuse prevention

---

# Search Stack

## Firestore Indexed Queries

MVP Solution

Purpose:

* Tracker search
* Event search

---

Future:

### Algolia

Purpose:

* Full-text search
* Fast filtering

---

# Deployment Stack

## Frontend Hosting

### Cloudflare Pages

Domain:

traxo.alokkumarsahu.in

Purpose:

* Static hosting
* Global CDN

---

## Backend Hosting

### Cloudflare Workers

Purpose:

* APIs
* Business logic

---

## DNS

### Cloudflare DNS

Purpose:

* Domain management
* Security

---

## SSL

### Cloudflare SSL

Purpose:

* HTTPS
* Security

---

# Project Structure

```text id="mqh7qk"
src/
│
├── app/
│
├── components/
│
├── features/
│
├── hooks/
│
├── services/
│
├── lib/
│
├── utils/
│
├── types/
│
├── constants/
│
└── store/
```

---

# Services Structure

```text id="0lquj0"
services/
│
├── auth/
│
├── firestore/
│
├── storage/
│
├── monitoring/
│
├── scraping/
│
├── notifications/
│
├── analytics/
│
└── workers/
```

---

# Environment Variables

## Firebase

```env id="a4nws5"
NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Cloudflare

```env id="6u2v7o"
CLOUDFLARE_ACCOUNT_ID=

CLOUDFLARE_QUEUE_NAME=
```

---

## Resend

```env id="4c9j6l"
RESEND_API_KEY=
```

---

## Telegram

```env id="v0k0mr"
TELEGRAM_BOT_TOKEN=
```

---

# Performance Targets

## Lighthouse

Target:

```text id="m0wq7f"
95+
```

---

## First Contentful Paint

Target:

```text id="39kg3v"
< 1.5s
```

---

## Largest Contentful Paint

Target:

```text id="dkg8fj"
< 2.5s
```

---

## CLS

Target:

```text id="5wwjgf"
< 0.1
```

---

# Future Technology Upgrades

## Phase 2

* Visual Diff Engine
* Advanced Analytics
* Public Marketplace

---

## Phase 3

* Team Workspaces
* Public API
* Webhooks

---

## Phase 4

* Mobile PWA
* Browser Extension
* Global Marketplace

---

# Technology Principles

1. TypeScript everywhere
2. Serverless-first architecture
3. Edge-first deployment
4. Firebase-managed infrastructure
5. Mobile-first UI
6. Dark-mode-first design
7. Performance over complexity
8. Reusable components only
9. Strong typing everywhere
10. Production-ready code only

---

# Final Stack Summary

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

State:

* Zustand
* TanStack Query

Animations:

* Framer Motion
* Motion One
* Lenis

Backend:

* Cloudflare Workers
* Cloudflare Queues
* Cloudflare Cron Triggers

Database:

* Firebase Firestore

Storage:

* Firebase Storage

Auth:

* Firebase Authentication

Monitoring:

* Playwright
* Cheerio

Notifications:

* Resend
* Telegram Bot API

Analytics:

* Recharts
* Firebase Analytics

Testing:

* Vitest
* Playwright

Deployment:

* Cloudflare Pages
* Cloudflare Workers
