# EBCS Backend — Enterprise Banking Core System

A **Modular Monolith** Spring Boot 3.3 backend implementing an Enterprise Banking Core System (EBCS), following DDD-Lite principles with strict module ownership boundaries.

## Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.3.5
- **Build**: Maven
- **Database**: PostgreSQL (H2 for tests)
- **Migration**: Flyway
- **Security**: Spring Security + JWT (jjwt 0.12.6)
- **Docs**: SpringDoc OpenAPI / Swagger UI
- **Validation**: Jakarta Validation
- **Testing**: JUnit 5 + Spring Boot Test

## Modules

```
com.ebcs
├── shared          # base entities, common exceptions, error DTOs
├── platform
│   ├── authentication  # JWT auth, SecurityConfig, /api/auth/**
│   └── audit           # append-only audit log
├── administration  # users, roles, configuration
├── customer        # KYC, profile
├── product         # savings/current/FD/RD/loan definitions
├── account         # account lifecycle & balance snapshot (pessimistic lock)
├── transaction     # deposit / withdraw / transfer / IMPS / reversal
├── ledger          # immutable double-entry ledger
├── deposit         # Fixed & Recurring deposits
├── loan            # loan lifecycle + EMI schedule
└── integration     # SMS / Email / UPI adapters (no business logic)
```

## Prerequisites

- JDK 21
- Maven 3.9+
- PostgreSQL 14+ (default: `postgresql://localhost:5432/ebcs`, user `ebcs`, password `ebcs`)

## Configuration

Environment variables (with defaults in `application.yml`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/ebcs` | JDBC URL |
| `DB_USER` | `ebcs` | DB user |
| `DB_PASSWORD` | `ebcs` | DB password |
| `SERVER_PORT` | `8080` | HTTP port |
| `JWT_SECRET` | *sample string* | JWT signing secret (>= 32 bytes; base64 or plain) |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24h) |

## Setup PostgreSQL

```sql
CREATE USER ebcs WITH PASSWORD 'ebcs';
CREATE DATABASE ebcs OWNER ebcs;
```

## Build & Run

```bash
# Build (runs unit tests on H2)
mvn clean install

# Start the application
mvn spring-boot:run
```

Application starts on: <http://localhost:8080>

## API Documentation

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>
- Health: <http://localhost:8080/actuator/health>

## Default Admin Credentials

Seeded by `V1__init.sql`:

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin123` |
| Role | `ROLE_ADMIN` |

## Quick Start (curl)

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .accessToken)

# Create a customer
curl -X POST http://localhost:8080/api/customers \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@doe.com","phone":"+15551234567"}'

# Create a product
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"SAV-STD","name":"Standard Savings","productType":"SAVINGS","interestRate":3.5}'

# Open an account
curl -X POST http://localhost:8080/api/accounts \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"customerId":1,"productId":1}'

# Deposit
curl -X POST http://localhost:8080/api/transactions/deposit \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":5000,"description":"Initial deposit"}'
```

## Endpoint Overview

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| CRUD | `/api/customers` | User |
| PUT  | `/api/customers/{id}/kyc` | Admin |
| CRUD | `/api/products` (POST = Admin) | User |
| CRUD | `/api/accounts` | User |
| GET  | `/api/accounts/{id}/balance` | User |
| POST | `/api/transactions/{deposit,withdraw,transfer,imps}` | User |
| POST | `/api/transactions/reverse/{reference}` | User |
| GET  | `/api/ledger/account/{id}` | User |
| POST | `/api/deposits/{fixed,recurring}` | User |
| POST | `/api/loans` | User |
| POST | `/api/loans/{id}/{approve,reject,disburse}` | Admin |
| GET  | `/api/loans/{id}/schedule` | User |
| CRUD | `/api/admin/users`, `/api/admin/config` | Admin |

## Financial Correctness Guarantees

- All monetary values use `BigDecimal(19,4)`.
- Balance updates use pessimistic row-level locks (`SELECT ... FOR UPDATE`) to prevent lost updates.
- Every debit/credit produces an immutable ledger entry.
- All timestamps are UTC.
- Transactional boundaries wrap money movement at the service level.

## Testing

```bash
mvn test
```

Tests run against embedded H2 (Postgres-compatibility mode) via `src/test/resources/application.yml`. Flyway is disabled in tests; JPA `create-drop` provisions the schema.

## Project Structure

```
/app
├── pom.xml
├── README.md
└── src
    ├── main
    │   ├── java/com/ebcs/...    # 11 modules
    │   └── resources
    │       ├── application.yml
    │       └── db/migration/V1__init.sql
    └── test
        ├── java/com/ebcs/...
        └── resources/application.yml
```

---

## Frontend (React SPA)

A production-ready banking frontend now lives under `/app/frontend`, replacing the earlier placeholder.

### Stack
- React 19 + React Router 7 + React Query 5 + Axios
- React Hook Form (all forms), Sonner (toasts)
- TailwindCSS + Radix UI (via shadcn/ui — 46 primitives)
- Recharts (dashboard charts), Lucide icons
- CRACO (path alias `@/*`)
- XLSX + jsPDF + FileSaver for CSV / Excel / PDF export

### Features implemented
- **Auth**: JWT login, register, remember-me, protected & role-based routes, 5-attempt account lockout, forgot / change-password UI (backend endpoints for reset pending)
- **Layout**: responsive sidebar + topbar + breadcrumbs, mobile sheet menu, dark/light theme (persisted), profile menu, in-app notifications, keyboard shortcuts (`g d`, `g c`, `g a`, `g t`, `g l`, `g p`, `g k`, `/` to focus search)
- **Dashboard**: 4 KPI cards, area chart (14-day tx volume), donut chart (tx mix), bar chart (loan pipeline), recent customers, recent transactions, pending approvals widget
- **Customers**: list w/ KYC filter, create dialog, details page (timeline, linked accounts, loans, KYC tab)
- **Products**: catalog + admin create
- **Accounts**: list, details with full & mini statement (from ledger), open new
- **Transactions**: deposit / withdraw / transfer / IMPS forms + reversal, filters (type, date range), full log w/ export
- **Deposits**: FD and RD tabs with book dialogs
- **Loans**: apply, admin approve/reject/disburse/settle, EMI schedule, interactive EMI calculator w/ amortization chart
- **KYC**: pending / verified / rejected tabs with approve/reject
- **Admin**: user management, configuration (upsert), audit log placeholder
- **Search**: global search across customers, accounts, transactions, loans
- **Errors**: 404, 403 and 500 pages
- **Tables**: reusable `DataTable` — search, sort, paginate, CSV/Excel/PDF export
- **Skeletons**: loading skeletons for tables and card grids
- **A11y**: focus-visible rings, semantic markup, keyboard-navigable menus and dialogs

### Running the frontend locally
```bash
cd /app/frontend
yarn install
yarn start
```

By default the frontend reads `REACT_APP_BACKEND_URL` from `.env` — set it to the URL where your Java backend is reachable. All API calls are prefixed with `/api` and carry a `Bearer <JWT>` header.

### Default credentials
`admin` / `admin123` — seeded by the V1 Flyway migration. See `/app/memory/test_credentials.md`.
