# Traxo Production Launch Preparation Guide

This document details the checks, security parameters, backup/recovery strategies, and observability parameters required for launching **Traxo** (Trackly) in production.

---

## 1. Production Launch Checklist

- [ ] **Infrastructure Verification**:
  - Cloudflare Pages is configured with the custom domain `traxo.alokkumarsahu.in`.
  - Edge routing limits and redirect behaviors are fully verified.
  - Workers API environment bindings match production credentials.
- [ ] **Database & Storage Provisioning**:
  - Production Firestore instance initialized in native mode.
  - Multi-region or regional bucket configured in Firebase Storage.
  - Composite indexes configured for querying collections.
- [ ] **Third-Party Integrations**:
  - Resend domain authenticated (DKIM/SPF keys resolved) for email dispatch.
  - Telegram bot token and bot webhook handlers registered.
- [ ] **Domain Scraper Proxies**:
  - Configure proxy rotations inside Playwright crawler contexts to prevent target domain IP blocks.

---

## 2. Security Checklist

- [ ] **Access Control Rules**:
  - Deploy `firestore.rules` validating user-level read/write permissions.
  - Deploy `storage.rules` verifying cross-service ownership of screenshots and exports.
- [ ] **SSRF & Network Sanitation**:
  - Verify that the Playwright and standard HTTP request handlers actively block connections to internal loopback ranges, local metadata endpoints, and private subnets.
- [ ] **Rate Limiting**:
  - Confirm API routing is rate-limited on Cloudflare (max 100 requests/minute per client IP).
- [ ] **Token Validation**:
  - Validate Web Crypto Firebase Auth ID Token verifier directly on Cloudflare Edge.

---

## 3. Monitoring & Observability Checklist

- [ ] **Centralized Logs**:
  - Central logger streams formatted structured JSON outputs in production.
- [ ] **Sentry Diagnostics**:
  - Sentry DSN loaded inside Workers and Next.js environments to capture uncaught exceptions.
- [ ] **Worker Queue Alerting**:
  - Configure Cloudflare Alerts on queue DLQ (Dead Letter Queue) message increases.
- [ ] **Crawler Latency Tracking**:
  - Set threshold alerts for crawler execution durations exceeding 15 seconds.

---

## 4. Backup & Disaster Recovery Strategy

### Daily Backup Pipeline
- Configure automated Firestore exports via Google Cloud Scheduler triggering the cloud function `gcloud firestore export`.
- Backups are stored in a designated cold-line storage bucket with a 30-day lifecycle retention policy.

### System Recovery Playbook
1. **API Server Outage**:
   - If the Next.js server fails to process crawls, Cloudflare Queue holds jobs up to 4 attempts using 15-minute backoff.
   - If a prolonged outage occurs, tasks automatically redirect to the Dead-Letter Queue (DLQ).
2. **Database State Restoration**:
   - Restore database collections using Google Cloud CLI:
     ```bash
     gcloud firestore import gs://traxo-backups-bucket/2026-06-13T17:00:00/
     ```
3. **Queue Purging**:
   - If corrupt messages overload queue consumers, execute Wrangler queue purging command:
     ```bash
     npx wrangler queues consumer purge SCANS_QUEUE
     ```
