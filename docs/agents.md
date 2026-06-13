# AGENTS.md

# Traxo AI Development Rules

Version: 1.0

---

# Project Overview

Project Name:

Traxo

---

Domain:

traxo.alokkumarsahu.in

---

Purpose:

Traxo is a premium website monitoring platform that allows users to track:

* Website changes
* Section changes
* Job postings
* Product prices
* PDF updates

Users receive notifications whenever meaningful changes occur.

---

# Mission

Build a production-grade SaaS product.

Never generate demo-quality code.

Never generate tutorial-quality code.

Every implementation should be scalable and maintainable.

---

# Development Principles

## Principle 1

Always prefer long-term maintainability over short-term speed.

---

## Principle 2

Avoid technical debt.

---

## Principle 3

Write code as if the application will serve 100,000+ users.

---

## Principle 4

Everything must be strongly typed.

No shortcuts.

---

# Tech Stack (Mandatory)

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Cloudflare Workers

Database:

* Firebase Firestore

Authentication:

* Firebase Authentication

Storage:

* Firebase Storage

Scheduling:

* Cloudflare Cron Triggers

Queues:

* Cloudflare Queues

Monitoring:

* Playwright
* Cheerio

Charts:

* Recharts

Animations:

* Framer Motion

Icons:

* Lucide React

---

# Strict Development Rules

## TypeScript

Always use strict mode.

Never use:

```ts
any
```

Never disable TypeScript checks.

Use:

```ts
type
```

or

```ts
interface
```

for every object.

---

## React Rules

Prefer:

Server Components

Whenever possible.

Use Client Components only when necessary.

---

Avoid:

Unnecessary useEffect.

---

Prefer:

Server Actions

where appropriate.

---

# File Structure Rules

Always follow:

```text
src/

app/

components/

features/

hooks/

lib/

services/

types/

constants/

utils/
```

Never place business logic inside UI components.

---

# Component Rules

Components must be:

* Reusable
* Small
* Typed

---

Maximum responsibility:

One component = one purpose.

---

Bad:

Huge 1000-line component.

---

Good:

Small composable components.

---

# UI Rules

Follow DESIGN_SYSTEM.md.

Always prioritize:

* Luxury UI
* Smooth animations
* Dark mode first
* Glassmorphism
* Responsive layouts

---

Never use:

* Bootstrap
* Material UI
* Generic admin styles

---

# Styling Rules

Use:

Tailwind CSS

Only.

---

Create reusable variants using:

```ts
cva()
```

where needed.

---

Avoid:

Inline styles.

---

# State Management

Use:

React Query

for server state.

---

Use:

Zustand

for global state.

---

Avoid:

Massive Context Providers.

---

# Data Fetching

Use:

TanStack Query

---

Implement:

* Loading states
* Error states
* Retry logic

---

Never leave data fetching unhandled.

---

# Firebase Rules

Always use:

Modular Firebase SDK.

---

Never use deprecated Firebase APIs.

---

All Firestore queries must be:

Indexed

and

Paginated.

---

Never fetch entire collections.

---

# Firestore Security

Every query must respect ownership.

Users must only access:

Their own:

* Trackers
* Notifications
* Collections

---

Never trust client-side validation.

---

Always validate server-side.

---

# Cloudflare Rules

Workers should handle:

* APIs
* Notifications
* Monitoring jobs

---

Never expose secrets.

---

Secrets must be stored using:

Cloudflare Secrets

---

# Monitoring Engine Rules

Monitoring logic must be separated from UI.

---

Create dedicated services:

```text
services/

monitoring/

notification/

scraping/

tracking/
```

---

Every monitoring action should:

* Create logs
* Create scan records
* Handle retries

---

# Notification Rules

Support:

* Email
* Telegram

Architecture must allow future support for:

* Discord
* Slack
* WhatsApp

without rewriting code.

---

# Error Handling

Every async operation must:

```ts
try
catch
```

and

log errors.

---

Never swallow errors.

---

Display user-friendly messages.

---

# Logging Rules

Create structured logs.

Example:

```ts
{
  service: "tracker",
  trackerId: "...",
  event: "scan_started"
}
```

---

No console.log in production.

Use centralized logger.

---

# Analytics Rules

Track:

* Active trackers
* Total scans
* Changes detected
* Notification delivery

---

Analytics should never block UI.

---

# Accessibility Rules

Every component must support:

* Keyboard navigation
* Focus states
* Screen readers

---

Minimum:

WCAG AA

---

# Performance Rules

Target:

Lighthouse 95+

---

CLS:

< 0.1

---

FCP:

< 1.5s

---

Avoid:

Large bundle sizes.

---

Use:

Dynamic imports.

---

Code splitting.

---

# Security Rules

Never expose:

* API Keys
* Firebase Admin Credentials
* Worker Secrets

---

Validate:

* URLs
* User Inputs
* Selectors

before processing.

---

Sanitize all user content.

---

# Testing Rules

Every feature must include:

Unit Tests

Integration Tests

---

Critical flows require:

E2E Tests

using:

Playwright

---

# Code Review Rules

Before considering code complete:

Checklist:

* Typed?
* Responsive?
* Accessible?
* Error handled?
* Secure?
* Tested?
* Production ready?

If not:

Refactor.

---

# Documentation Rules

Every major feature must include:

* README
* Usage Example
* API Docs

---

Keep documentation updated.

---

# Forbidden Practices

Never:

* Use any
* Disable TypeScript
* Hardcode secrets
* Use deprecated libraries
* Create giant components
* Skip loading states
* Skip error handling
* Use mock production data
* Ignore accessibility
* Ignore responsiveness

---

# MVP Priorities

Phase 1:

1. Authentication
2. Dashboard
3. Trackers
4. Website Monitoring
5. PDF Monitoring
6. Job Tracking
7. Price Tracking
8. Email Notifications
9. Telegram Notifications
10. History

---

Phase 2:

1. Collections
2. Visual Diff
3. Analytics
4. Advanced Filters

---

Phase 3:

1. Public Marketplace
2. API Platform
3. Team Workspaces

---

# Final Instruction

Every decision should optimize for:

* Scalability
* Maintainability
* Performance
* Security
* User Experience

Traxo should feel like a premium SaaS product built by a world-class engineering team, not a college project.
