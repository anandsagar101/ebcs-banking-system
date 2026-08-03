<!-- ========================================================= -->
<!--  EBCS · Enterprise Banking Core System · README           -->
<!-- ========================================================= -->

<p align="center">
  <img src="docs/assets/banner.svg" alt="EBCS — Enterprise Banking Core System" width="100%" />
</p>

<p align="center">
  <b>A production-grade, modular core banking platform.</b><br/>
  Customers · Accounts · Transactions · Deposits · Loans · Double-entry Ledger — behind a real-time React console.
</p>

<p align="center">
  <img alt="Java" src="https://img.shields.io/badge/Java-21-E76F00?logo=openjdk&logoColor=white">
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?logo=springboot&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-34D399">
  <img alt="PRs" src="https://img.shields.io/badge/PRs-welcome-818CF8">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Domain Modules](#domain-modules)
- [API Reference](#api-reference)
- [Security](#security)
- [Real-time & Events](#real-time--events)
- [Data & Persistence](#data--persistence)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Observability](#observability)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**EBCS (Enterprise Banking Core System)** is a full-stack reference implementation of a retail
core banking platform. The backend is a **Spring Boot 3.3.5 / Java 21** application organised into
isolated **bounded contexts** (accounts, customers, transactions, deposits, loans, ledger, and more),
each with its own controller, service, domain, and repository layers. Every balance-affecting operation
is recorded through a **double-entry ledger**, and money movement is streamed to connected clients over
**WebSocket** in real time.

The frontend is a **React 19** single-page banking console built on `shadcn/ui`, TanStack Query, and
Tailwind CSS, covering customer onboarding, KYC, account servicing, lending, reporting, and full
administrative control.

The entire stack — PostgreSQL, backend, and frontend — runs with a single `docker compose up`.

> **At a glance:** 146 Java source files · 17 REST controllers · 19 domain services · 22 repositories · 98 React files · 25 screens.

---

## Feature Highlights

**Banking operations**
- Customer master with **KYC** lifecycle (`PENDING → VERIFIED / REJECTED`)
- Account opening, balance enquiry, and status management
- Transactions: **deposit, withdrawal, transfer, IMPS**, and reference-based **reversal**
- **Fixed & recurring deposits** with booking and lookup
- End-to-end **loan lifecycle**: apply → approve/reject → disburse → **EMI schedule** → settle
- **Double-entry ledger** — every transaction produces balanced debit/credit entries per account
- Configurable banking **products** and product types

**Platform**
- Stateless **JWT** authentication with an optional second factor
- **TOTP-based MFA** (authenticator-app enrolment, verification, and login challenge)
- **Password-reset via OTP** with TTL, resend cooldown, and attempt limits
- **Session & device management** — login history, trusted devices, remote revocation
- **Rate limiting** on authentication endpoints
- **Audit trail** on every mutating action
- **Document management** with versioning, preview, and **OCR** (Tesseract)
- Multi-channel **notifications** (email / SMS / push) with per-user preferences
- **Reporting & analytics** — portfolio overview, customer growth, transaction analytics, revenue
- **Feature flags** and runtime **configuration** administered via API
- **Real-time balance push** over STOMP/WebSocket
- Interactive **OpenAPI / Swagger UI** and **Actuator** health, info, and metrics

---

## Architecture

EBCS follows a **layered, event-driven, modular-monolith** design. Requests flow top-to-bottom through
a security filter chain, REST controllers, domain services, the domain model, and the persistence layer.
Cross-cutting concerns (async execution, domain events, audit, WebSocket, error handling) live in a
shared **platform** module, and all outbound side-effects go through **integration adapters**.

<p align="center">
  <img src="docs/assets/architecture.svg" alt="EBCS system architecture" width="100%" />
</p>

**Design principles**

- **Bounded contexts** — each business capability (`account`, `loan`, `ledger`, …) is a self-contained
  package with `controller` / `application` / `domain` / `dto` / `repository` slices. Contexts communicate
  through **domain events** rather than reaching into each other's internals.
- **Double-entry integrity** — the `ledger` module is the single source of truth for money movement; every
  `MoneyMovedEvent` is projected into balanced ledger entries.
- **Event-driven side-effects** — registration, account opening, loan approval, and money movement publish
  Spring application events that notification, audit, and WebSocket listeners react to asynchronously.
- **Stateless & horizontally scalable** — JWT-based auth means no server session state; the app scales out
  behind a load balancer.

---

## Tech Stack

| Layer            | Technology |
|------------------|------------|
| **Language**     | Java 21 |
| **Framework**    | Spring Boot 3.3.5 (Web, Validation, Data JPA, Security, WebSocket, Actuator) |
| **Auth**         | Spring Security · JJWT · TOTP (commons-codec) |
| **Persistence**  | PostgreSQL 15 · Hibernate · Flyway · H2 (tests) |
| **API docs**     | springdoc-openapi (Swagger UI) |
| **Build**        | Maven (`com.ebcs:ebcs-backend:1.0.0`) |
| **Frontend**     | React 19 · React Router 7 · CRA + CRACO |
| **Data/UI**      | TanStack Query · SWR · Axios · react-hook-form + Zod |
| **Design system**| Tailwind CSS 3 · shadcn/ui (Radix UI) · Framer Motion · lucide-react |
| **Charts/Export**| Recharts · jsPDF · SheetJS (xlsx) · file-saver |
| **Realtime**     | STOMP over SockJS (`@stomp/stompjs`) |
| **Runtime**      | Docker (multi-stage) · nginx (frontend) · Docker Compose |

---

## Domain Modules

Backend packages under `com.ebcs`:

| Module           | Responsibility |
|------------------|----------------|
| `account`        | Account opening, balances, and account lifecycle status |
| `customer`       | Customer master data and KYC state |
| `product`        | Bank products and product types |
| `transaction`    | Deposits, withdrawals, transfers, IMPS, and reversals |
| `deposit`        | Fixed and recurring deposit booking and servicing |
| `loan`           | Origination, approval, disbursement, EMI schedules, settlement |
| `ledger`         | Double-entry ledger — debit/credit entries per account & transaction |
| `document`       | Uploads, versioning, preview, download, and OCR extraction |
| `notification`   | In-app + email/SMS/push delivery with per-user preferences |
| `reports`        | Portfolio overview, growth, transaction analytics, revenue estimates |
| `administration` | App users, roles, runtime configuration, feature flags |
| `security`       | MFA (TOTP), password-reset OTP, rate limiting, sessions & devices |
| `platform`       | JWT authentication, audit, async execution, domain events, WebSocket |
| `integration`    | Outbound adapters — email, SMS, UPI |
| `shared`         | Base audit entity, API error model, global exception handling |

---

## API Reference

All endpoints are served under the `/api` prefix. Explore them interactively at
**`/swagger-ui.html`** once the backend is running.

### Authentication — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Authenticate and receive a JWT (or an MFA challenge) |
| `POST` | `/mfa/login-verify` | Complete login by verifying the MFA code |
| `POST` | `/change-password` | Change password for the current user |
| `POST` | `/forgot-password` | Start OTP-based password reset |
| `POST` | `/resend-otp` | Resend the reset OTP (respects cooldown) |
| `POST` | `/verify-otp` | Verify a reset OTP |
| `POST` | `/reset-password` | Complete the password reset |

### Customers — `/api/customers`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | List customers |
| `GET`  | `/{id}` | Get a customer |
| `POST` | `/` | Create a customer |
| `PUT`  | `/{id}` | Update a customer |
| `PUT`  | `/{id}/kyc` | Update KYC status |

### Accounts — `/api/accounts`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | List accounts |
| `GET`  | `/{id}` | Get an account |
| `GET`  | `/customer/{customerId}` | Accounts for a customer |
| `GET`  | `/{id}/balance` | Current balance |
| `POST` | `/` | Open an account |

### Transactions — `/api/transactions`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/deposit` | Deposit funds |
| `POST` | `/withdraw` | Withdraw funds |
| `POST` | `/transfer` | Internal transfer |
| `POST` | `/imps` | IMPS transfer |
| `POST` | `/reverse/{reference}` | Reverse a transaction |
| `GET`  | `/` | List transactions |
| `GET`  | `/{reference}` | Get a transaction by reference |

### Deposits — `/api/deposits`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/fixed` · `/recurring` | Book a fixed / recurring deposit |
| `GET`  | `/fixed` · `/recurring` | List deposits |
| `GET`  | `/fixed/{id}` · `/recurring/{id}` | Get a deposit |

### Loans — `/api/loans`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` · `/{id}` | List / get loans |
| `POST` | `/` | Apply for a loan |
| `POST` | `/{id}/approve` · `/{id}/reject` | Approve / reject |
| `POST` | `/{id}/disburse` · `/{id}/settle` | Disburse / settle |
| `GET`  | `/{id}/schedule` | EMI repayment schedule |

### Ledger — `/api/ledger`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/account/{accountId}` | Ledger entries for an account |
| `GET`  | `/transaction/{ref}` | Ledger entries for a transaction |

### Documents — `/api/documents`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Upload a document (multipart) |
| `GET`  | `/` · `/{id}` | List / get documents |
| `GET`  | `/{id}/versions` | Version history |
| `GET`  | `/{id}/download` · `/{id}/preview` | Download / preview |
| `POST` | `/{id}/ocr` | Run OCR extraction |

### Notifications — `/api/notifications`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | List notifications |
| `GET`  | `/unread-count` | Unread count |
| `POST` | `/{id}/read` | Mark as read |
| `GET`  | `/preferences` · `PUT /preferences` | Read / update channel preferences |

### Reports — `/api/reports`
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/overview` | Portfolio snapshot |
| `GET`  | `/customers/growth?months=` | Customer growth series |
| `GET`  | `/transactions/analytics?days=` | Transaction analytics |
| `GET`  | `/deposits` · `/loans` | Deposit / loan summaries |
| `GET`  | `/revenue?months=` | Revenue estimate |

### Security & Admin
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/security/login-history` | Login history |
| `GET`  | `/api/security/devices` | Known devices |
| `POST` | `/api/security/devices/{id}/trust` · `/revoke` | Trust / revoke a device |
| `GET`  | `/api/security/mfa/status` | MFA status |
| `POST` | `/api/security/mfa/enroll` · `/verify` | Enrol / verify MFA |
| `DELETE`| `/api/security/mfa` | Disable MFA |
| `GET`  | `/api/admin/audit` | Audit log |
| `GET`/`PUT` | `/api/admin/config` | Runtime configuration |
| `GET`  | `/api/admin/users` · `/{id}` | User administration |
| `GET`/`PUT` | `/api/admin/feature-flags` | Feature flags |

---

## Security

- **JWT** bearer tokens (HS256, configurable secret, issuer `ebcs-backend`, 24h default expiry) issued at login
  and validated by `JwtAuthenticationFilter`.
- **MFA (TOTP)** — users enrol an authenticator app; when enabled, `/login` returns a challenge completed via
  `/mfa/login-verify`.
- **Password reset** — OTP flow with configurable TTL (300s), resend cooldown (60s), and max attempts (5).
- **Rate limiting** — `RateLimitFilter` throttles auth traffic (20 req/min default).
- **Sessions & devices** — every login is recorded; devices can be trusted or revoked remotely.
- **Audit** — `AuditService` persists an `AuditLog` entry for mutating operations.
- **CORS** configurable via `CORS_ALLOWED_ORIGINS`.
- **Hardened container** — the backend image runs as a non-root user (`uid 10001`) with a healthcheck.

> Change `JWT_SECRET` and all default credentials before any non-local deployment.

---

## Real-time & Events

Domain operations publish Spring application events — `CustomerRegisteredEvent`, `AccountOpenedEvent`,
`MoneyMovedEvent`, `LoanApprovedEvent`, `LoanDisbursedEvent`, `UserLoggedInEvent` — that are handled
**asynchronously** by dedicated listeners:

- **Notifications** — `NotificationEventListener` fans events out to email/SMS/push providers.
- **Real-time balances** — `BalancePushListener` streams balance updates to subscribed clients over
  STOMP/WebSocket; the React console consumes them through the `useStomp` hook.
- **Audit** — mutations are captured into the audit log.

---

## Data & Persistence

- **PostgreSQL 15** is the primary datastore; schema is owned and versioned by **Flyway**
  (`V1__init.sql`, `V2__enterprise.sql`, `V3__features.sql`) under `src/main/resources/db/migration`.
- `ddl-auto: validate` — Hibernate never mutates schema; migrations are the source of truth.
- All entities extend `BaseAuditEntity` for consistent auditing columns.
- **H2** backs the test profile for fast, isolated integration tests.
- Timestamps are stored and served in **UTC**.

---

## Project Structure

```
ebcs/
├── Dockerfile                     # Multi-stage backend image (Temurin 21, non-root)
├── docker-compose.yml             # postgres + backend + frontend
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/ebcs/
│   │   │   ├── account/           # ── bounded contexts ──
│   │   │   ├── customer/
│   │   │   ├── product/
│   │   │   ├── transaction/
│   │   │   ├── deposit/
│   │   │   ├── loan/
│   │   │   ├── ledger/
│   │   │   ├── document/
│   │   │   ├── notification/
│   │   │   ├── reports/
│   │   │   ├── administration/
│   │   │   ├── security/          # mfa · passwordreset · ratelimit · session
│   │   │   ├── platform/          # auth · audit · async · events · websocket
│   │   │   ├── integration/       # email · sms · upi
│   │   │   ├── shared/            # base entity · errors · exceptions
│   │   │   └── EbcsApplication.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/      # V1__init · V2__enterprise · V3__features
│   └── test/java/com/ebcs/        # service + application tests (H2)
└── frontend/
    ├── Dockerfile                 # build → nginx
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── pages/                 # 25 screens (Dashboard, Loans, Reports, Admin…)
        ├── components/            # AppShell, Sidebar, DataTable, KpiCard… + ui/ (shadcn)
        ├── contexts/              # AuthContext · ThemeContext
        ├── hooks/                 # useStomp · useKeyboardShortcuts · use-toast
        └── lib/                   # api · services · exporters · format
```

---

## Getting Started

### Prerequisites
- **Docker & Docker Compose** (recommended path), or
- **JDK 21**, **Maven 3.9+**, **Node 18+** with **Yarn**, and a local **PostgreSQL 15** for native dev
- *(optional)* the **`tesseract`** binary on `PATH` for document OCR

### Quick start (Docker Compose)

```bash
git clone https://github.com/<your-org>/ebcs.git
cd ebcs
docker compose up --build
```

| Service        | URL |
|----------------|-----|
| Frontend       | http://localhost:3000 |
| Backend API    | http://localhost:8080 |
| Swagger UI     | http://localhost:8080/swagger-ui.html |
| Health         | http://localhost:8080/actuator/health |

Create your first user via `POST /api/auth/register` (or the console's **Register** screen), then sign in.

### Local development

**Backend** — start a database, then run the app:

```bash
docker compose up -d postgres        # or point DB_URL at your own Postgres
mvn spring-boot:run
```

**Frontend**

```bash
cd frontend
yarn install
REACT_APP_BACKEND_URL=http://localhost:8080 yarn start
```

---

## Configuration

The backend is fully configured through environment variables (defaults in `application.yml`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/ebcs` | JDBC connection string |
| `DB_USER` / `DB_PASSWORD` | `ebcs` / `ebcs` | Database credentials |
| `SERVER_PORT` / `PORT` | `8080` | HTTP port |
| `JWT_SECRET` | *(change me)* | HS256 signing secret (≥ 256-bit) |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24h) |
| `MFA_ISSUER` | `EBCS` | Issuer shown in authenticator apps |
| `RATELIMIT_AUTH_PER_MINUTE` | `20` | Auth requests per minute |
| `PW_RESET_TTL` | `300` | OTP validity (seconds) |
| `PW_RESET_RESEND_COOLDOWN` | `60` | Resend cooldown (seconds) |
| `PW_RESET_MAX_ATTEMPTS` | `5` | Max OTP attempts |
| `CORS_ALLOWED_ORIGINS` | `*` | Allowed CORS origins |
| `DOC_STORAGE_PATH` | `/tmp/ebcs-docs` | Document storage directory |
| `DOC_MAX_SIZE` | `15728640` | Max upload size (bytes, 15 MB) |
| `OCR_BINARY` | `tesseract` | OCR executable |
| `OCR_TIMEOUT` / `OCR_MAX_CHARS` | `60` / `20000` | OCR limits |
| `NOTIFY_EMAIL` / `NOTIFY_SMS` / `NOTIFY_PUSH` | `true` | Notification channels |
| `RESEND_API_KEY` | *(empty)* | Resend API key for real email |
| `RESEND_SENDER_EMAIL` | `onboarding@resend.dev` | From-address for email |

> Without `RESEND_API_KEY`, notifications fall back to logging providers — perfect for local development.

---

## Testing

```bash
mvn test
```

Tests run against an in-memory **H2** database (`src/test/resources/application.yml`) and cover the
service layer (e.g. `CustomerServiceTest`, `TransactionServiceTest`) plus an application context smoke test.

---

## Deployment

- **Backend image** — multi-stage build: `maven:3.9-eclipse-temurin-21` compiles the JAR, which is copied
  into a slim `eclipse-temurin:21-jre` runtime running as a **non-root** user with a container **healthcheck**.
- **Frontend image** — built and served by **nginx**; the backend URL is injected at build time via
  `REACT_APP_BACKEND_URL`.
- **Compose** wires PostgreSQL (with `pg_isready` healthcheck and a persistent volume), the backend, and the
  frontend, with startup ordering via `depends_on: service_healthy`.

For production: supply a strong `JWT_SECRET`, restrict `CORS_ALLOWED_ORIGINS`, use managed Postgres, and
mount persistent storage for `DOC_STORAGE_PATH`.

---

## Observability

Spring Boot Actuator exposes operational endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/actuator/health` | Liveness/readiness (used by the container healthcheck) |
| `/actuator/info` | Build & app info |
| `/actuator/metrics` | Application metrics |

---

## Contributing

Contributions are welcome. Please:

1. Fork the repo and create a feature branch (`git checkout -b feature/your-feature`).
2. Keep changes within the relevant bounded context and add tests.
3. Run `mvn test` before opening a PR.
4. Open a pull request with a clear description of the change.

---

## License

Released under the **MIT License**. Add a `LICENSE` file at the repository root to make the terms explicit.

---

<p align="center"><sub>Built with Spring Boot, React, and a strict double-entry ledger. ⚖️</sub></p>