# PHASE 0 — Repo Audit (DB-First Full Reset)

## 1) Current state (as of reset)

| Item | Location | Status |
|------|----------|--------|
| **Backend root** | `backend/` | Single Spring Boot app (one `pom.xml`, one JAR). No parent/child modules. |
| **Service modules** | *(none)* | Legacy `backend/services/*` (gateway, user-service, audition-service, media-service) and `backend/libs/*` were **already removed** in a prior monolith reset. |
| **pom.xml** | `backend/pom.xml` | Single module; parent = `spring-boot-starter-parent`; no `<modules>`. |
| **Next.js root** | `frontend/web/` | Single Next.js app; `package.json`, `src/app/`, `src/lib/api/`. |

## 2) What will be removed / archived

- **Nothing to delete** in this pass: multi-service folders were already removed.
- **Archive placeholder:** `docs/_archived_legacy/<timestamp>/` contains a README only, documenting that legacy code was removed earlier (no code to archive now). Build graph already does not reference any old paths.

## 3) What will be kept

| Path | Role |
|------|------|
| `backend/` | Single deployable; build = `./mvnw -DskipTests package`, start = `java -jar target/*.jar`. |
| `backend/src/main/java/com/audition/platform/` | Application, domain/*, api/, infra/. |
| `backend/src/main/resources/db/migration/` | Flyway SSOT; V1__init.sql (updated to DB-first spec). |
| `frontend/web/` | Unchanged; API base URL via `NEXT_PUBLIC_API_URL`. |
| `docs/` (includes `docs/scripts` for helper scripts), repo root files | Kept. |

## 4) Build / deploy paths (Railway)

- **Backend:** Root = `backend` → one JAR in `backend/target/*.jar`.
- **Frontend:** Root = `frontend/web` → standard Next.js build/start.
- **Postgres:** New instance recommended; no legacy schema.
