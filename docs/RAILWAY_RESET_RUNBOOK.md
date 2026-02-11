# Railway Reset Runbook (DB-First Monolith)

Step-by-step instructions to reset Railway to: **1 Postgres + 1 Backend + 1 Frontend**.

---

## Prerequisites

- Railway project with access to add/remove services and Postgres.
- Repo with monolith backend at `backend/` and Next.js at `frontend/web/`.

---

## Step 1: (Optional) Remove old services

If you have existing Railway services from the previous multi-service setup:

1. Open your Railway project.
2. **Delete** (or deactivate) any of:
   - gateway
   - user-service
   - audition-service
   - media-service
   - Any other backend services that are not the new single backend.
3. **Do not delete** the project; we will add/use one Backend and one Frontend and one Postgres.

---

## Step 2: Create or reset Postgres

**Option A — New Postgres (recommended for clean schema):**

1. In Railway dashboard: **New** → **Database** → **PostgreSQL**.
2. Wait until the Postgres service is running.
3. Open the Postgres service → **Variables** (or **Connect**) and note:
   - `DATABASE_URL` or
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
4. We will use these for the Backend service (see Step 4).  
   Typical internal URL: `jdbc:postgresql://<host>:5432/railway` with host like `postgres.railway.internal` if Railway provides it.

**Option B — Reuse existing Postgres:**

- If you keep an existing Postgres, ensure you are OK **dropping all data** (Flyway V1 will create tables from scratch on a fresh DB).  
- If the DB already has tables from an old schema, either:
  - Create a **new Postgres** instance and point the Backend to it, or
  - Manually drop all tables/schemas and redeploy so Flyway runs V1 on empty DB.

---

## Step 3: Create Backend service

1. **New** → **GitHub Repo** (or **Empty Service** and connect repo later).
2. Select the repo and branch.
3. **Settings** for this service:
   - **Root Directory:** `backend`
   - **Build Command:** `chmod +x mvnw && ./mvnw -DskipTests package`
   - **Start Command:** `java -jar target/*.jar`
   - **Watch Paths:** (optional) `backend/**` so only backend changes trigger builds.

---

## Step 4: Backend environment variables

In the Backend service → **Variables**, set:

| Variable | Value | Required |
|----------|--------|----------|
| `SPRING_PROFILES_ACTIVE` | `production` | Yes |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<POSTGRES_HOST>:5432/<DB_NAME>` | Yes |
| `SPRING_DATASOURCE_USERNAME` | Postgres username | Yes |
| `SPRING_DATASOURCE_PASSWORD` | Postgres password | Yes |

- **Do not set** `SPRING_JPA_HIBERNATE_DDL_AUTO` (or any JPA schema-generation variable). Production uses `ddl-auto=none`; Flyway is the only schema authority.
- For **private** DB on Railway, use the **internal** host (e.g. `postgres.railway.internal`) in `SPRING_DATASOURCE_URL` so traffic stays on Railway’s network.

---

## Step 5: Deploy Backend and get URL

1. Deploy the Backend (push to branch or **Deploy** in Railway).
2. Wait for build and start. Check logs for:
   - `[Startup] Active profile(s): [production]`
   - `[Startup] Effective JPA ddl-auto: none`
   - `[Startup] Flyway migrations: N applied, 0 pending`
3. Open **Settings** → **Networking** → **Generate domain** (if not already).
4. Copy the public URL (e.g. `https://backend-production-xxxx.up.railway.app`). This is the **Backend URL** for the frontend.

---

## Step 6: Create Frontend service

1. **New** → **GitHub Repo** (same repo as backend).
2. **Settings** for this service:
   - **Root Directory:** `frontend/web`
   - Use Railway’s **Nixpacks** or **Node** preset; build/start as per Next.js (e.g. `npm run build`, `npm start` or framework preset).

---

## Step 7: Frontend environment variables

In the Frontend service → **Variables**, set:

| Variable | Value | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_API_URL` | `https://<BACKEND_DOMAIN>` (no trailing slash) | Yes |

- This project uses **`NEXT_PUBLIC_API_URL`** (not `NEXT_PUBLIC_API_BASE_URL`). Example: `https://backend-production-xxxx.up.railway.app`.
- Rebuild/redeploy the frontend after changing this (Next.js bakes it in at build time).

---

## Step 8: Acceptance check

1. **Backend**
   - Build succeeds.
   - No `SchemaManagementException` in logs.
   - Flyway runs and applies V1 (see startup logs).
   - `GET https://<backend-domain>/api/health` → `200` and `{"ok":true}`.
   - `GET https://<backend-domain>/api/version` → `200` and `{"version":"...","buildId":"..."}`.
2. **Frontend**
   - Build succeeds; app loads and can call backend (e.g. health or version) if the UI uses it.

---

## Summary: What to delete / create

| Action | Item |
|--------|------|
| Delete (optional) | Old gateway, user-service, audition-service, media-service (if present). |
| Create / use | One **Postgres** (new recommended). |
| Create | One **Backend** service (root `backend`, Maven build, `java -jar target/*.jar`). |
| Create | One **Frontend** service (root `frontend/web`, Next.js build/start). |
| Do not set | Any JPA/Hibernate DDL env vars; Flyway is SSOT. |
