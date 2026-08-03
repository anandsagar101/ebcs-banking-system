# EBCS Docker Compose

Single command bring-up of the entire EBCS stack:

```bash
docker compose up --build
```

Services:

| Service   | Port  | Purpose                                     |
|-----------|-------|---------------------------------------------|
| postgres  | 5432  | PostgreSQL 15 (persistent volume `ebcs-pgdata`) |
| backend   | 8080  | Spring Boot 3.3, Java 21, Flyway auto-migration |
| frontend  | 3000  | React SPA served by nginx (static + gzip)   |

## Configuration

Override the following via env vars or a `.env` file next to `docker-compose.yml`:

- `JWT_SECRET` — HMAC signing secret (at least 32 chars). Do NOT ship default in production.
- `PUBLIC_BACKEND_URL` — the URL your browser will use to reach the backend. Defaults to `http://localhost:8080`. Set this to your public HTTPS URL in production.

## First-time login

Backend seeds `admin` / `admin123` (bcrypt) via Flyway `V1__init.sql`. Change immediately using **Change password** in the UI.

## Volumes

- `ebcs-pgdata` — Postgres data
- `ebcs-docs` — Uploaded KYC / customer documents

## Health checks

- Backend exposes `/actuator/health` — used by compose health probe.
- Frontend health check ensures nginx is serving.
