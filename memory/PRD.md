# EBCS — Product Requirements Document

## Original problem statement
Full-stack Enterprise Banking Core System. Generate a complete runnable Maven Spring Boot backend (Java 21 + PostgreSQL + JWT), integrate a production-ready React banking frontend, then upgrade the entire application to Enterprise / FAANG level with MFA, device management, notifications, reports, domain events, rate limiting, feature flags and Docker Compose.

## User choices
- Backend: Spring Boot 3.3 / Java 21 / PostgreSQL / Flyway / JWT / REST
- Frontend: React 19, React Router, React Query, Axios, React Hook Form, TailwindCSS, Radix UI, CRACO
- Enterprise upgrade layered on top without breaking any existing API

## Architecture
- Modular Monolith under `com.ebcs` (15+ modules now): shared, platform.{authentication,audit,events,async}, administration, customer, product, account, transaction, ledger, deposit, loan, integration, notification, security.{mfa,session,ratelimit}, document, reports.
- Event-driven core: services publish Spring `ApplicationEvent`s (CustomerRegistered, AccountOpened, MoneyMoved, LoanApproved, LoanDisbursed, UserLoggedIn). Async listeners fan out to Notification module and (extensible) audit / analytics / fraud consumers.
- Provider abstraction for notification channels (Email / SMS / Push) with pluggable `NotificationProvider` implementations (default LoggingProvider, swap for SES / Twilio / FCM).
- Frontend: SPA with lazy-loaded route bundles, centralized Axios client, React Query cache, reusable DataTable/KpiCard/AppShell/Sidebar/Topbar/Breadcrumbs.

## Enterprise upgrade (2026-01)

### Security
- MFA (TOTP RFC 6238, HmacSHA1, Base32) with enroll → verify → enable → disable + QR URL for authenticator apps
- Login history: every login attempt recorded (username, IP, UA, success/failure reason)
- Device management: fingerprinted device tracking (SHA-256 of UA+IP), trust/revoke actions
- Rate limiting: in-memory token bucket, 20 req/min per IP for `/api/auth/login` and `/api/auth/register`, returns HTTP 429 with `Retry-After: 60`
- Change password endpoint with bcrypt verification
- Feature flags (`feature_flags` table + admin toggle endpoint)

### Notifications
- Provider abstraction (`NotificationProvider` interface + `LoggingEmail/Sms/PushProvider`)
- `NotificationService` persists every dispatch to `notifications` table
- Per-user preferences (`notification_preferences`) with UI toggles
- Async event listeners generate notifications for CustomerRegistered / AccountOpened / MoneyMoved / LoanApproved / LoanDisbursed
- In-app inbox with unread counter and mark-read

### Documents
- Upload (image + PDF, 15MB cap) with SHA-256 checksum
- Version history (previous file preserved in `document_versions`)
- Preview and download endpoints
- Multi-owner (CUSTOMER / LOAN / ACCOUNT)
- OCR-ready — `ocr_text` column + feature flag `documents.ocr.enabled`

### Reports
- `/api/reports/overview` — top-level KPIs
- `/api/reports/customers/growth?months=N`
- `/api/reports/transactions/analytics?days=N`
- `/api/reports/deposits`, `/api/reports/loans`
- `/api/reports/revenue?months=N` — estimated interest revenue projection
- All exportable via UI (CSV / Excel / PDF)

### Audit
- Read endpoint `/api/admin/audit` (paginated, admin-only)
- Live dashboard page replaces earlier placeholder

### Infra
- **Docker Compose** at `/app/docker-compose.yml` — `docker compose up --build` boots Postgres 15 + Spring Boot 3.3 backend + nginx-served React frontend end-to-end
- Multi-stage Dockerfiles (`/app/Dockerfile`, `/app/frontend/Dockerfile`) for reproducible images
- Non-root user in backend image, healthchecks on all services, persistent volumes for Postgres data and document storage

### Frontend additions
- New pages: `/reports`, `/security`, `/notifications`, `/admin/feature-flags`, `/admin/audit` (now live), plus real Documents panel inside CustomerDetails
- Nav restructured into Overview / Account / Administration sections
- All flows wired to real APIs — no mocks

## Verification
- `mvn clean install` — BUILD SUCCESS, all 3 tests pass
- Backend live on port 8001 (in-pod) with PostgreSQL 15
- Full stack verified end-to-end via preview URL: login, MFA enroll+verify+disable, change-password rejection of wrong current, rate limiter returning 429 after 19 attempts, customer create firing CustomerRegisteredEvent → 2 notifications persisted (EMAIL + SMS), audit page showing 15 real events, feature flags toggling.

## Test credentials
`admin` / `admin123` — see `/app/memory/test_credentials.md`. Rate limit resets every 60 s.

## Backlog / P1
- Password reset flow (token issuance + email delivery via NotificationService)
- MFA enforcement at login (challenge/response step)
- OCR pipeline (Tesseract/textract) triggered when `documents.ocr.enabled` flag flips
- Permission matrix beyond role — per-endpoint permission grants
- Redis-backed rate limit + session store for horizontal scale
- WebSocket push channel for live dashboard KPIs
- End-to-end tests in `mvn test` covering full event chain

## P2
- Migrate to Spring Modulith to enforce package boundaries
- Regulatory reporting module (RBI / OCC statements)
- Multi-currency + FX support
- Fraud detection service consuming MoneyMovedEvent stream
