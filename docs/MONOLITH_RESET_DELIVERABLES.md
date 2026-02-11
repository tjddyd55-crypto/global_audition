# Monolith Reset — Deliverables (PHASE 6)

## 1. Final folder tree

```
audition-platform/
  backend/
    .mvn/wrapper/
      maven-wrapper.properties
    mvnw
    mvnw.cmd
    pom.xml
    railway.toml
    src/main/java/com/audition/platform/
      Application.java
      api/
        HealthController.java
      domain/
        admin/package-info.java
        audition/package-info.java
        common/package-info.java
        media/package-info.java
        user/package-info.java
      infra/
        SecurityConfig.java
    src/main/resources/
      application.yml
      application-production.yml
      db/migration/
        V1__init.sql
    target/
      audition-platform-backend-1.0.0-SNAPSHOT.jar   (after build)
  frontend/web/          (unchanged — single Next.js app)
  docs/
    MONOLITH_RESET_PLAN.md
    MONOLITH_RESET_DELIVERABLES.md
```

## 2. Railway setup

### Backend service

| Setting | Value |
|--------|--------|
| **Root directory** | `backend` |
| **Build command** | `chmod +x mvnw && ./mvnw -DskipTests package` |
| **Start command** | `java -jar target/*.jar` |

**Required environment variables:**

- `SPRING_PROFILES_ACTIVE` = `production`
- `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<postgres-host>:5432/railway` (e.g. `jdbc:postgresql://postgres.railway.internal:5432/railway`)
- `SPRING_DATASOURCE_USERNAME` = (Railway Postgres username)
- `SPRING_DATASOURCE_PASSWORD` = (Railway Postgres password)

Do **not** set `SPRING_JPA_HIBERNATE_DDL_AUTO` or any JPA schema-generation property. Flyway is the single source of truth and runs on boot.

### Postgres

- Single Postgres instance (Railway Postgres plugin or external).
- Backend connects via `SPRING_DATASOURCE_*`. Flyway creates schema on first boot.

### Frontend service

| Setting | Value |
|--------|--------|
| **Root directory** | `frontend/web` |
| **Build / start** | Standard Next.js (e.g. `npm run build`, `npm start` or framework preset) |

**Environment:**

- `NEXT_PUBLIC_API_BASE_URL` = `https://<backend-service-domain>` (public backend URL for browser calls)

## 3. Migration list

| Migration | Creates / purpose |
|-----------|--------------------|
| **V1__init.sql** | Single baseline: **users** → **applicant_profiles**, **business_profiles** → **auditions** → **applications**, **application_photos** → **video_contents** → **creative_assets** → **video_feedback** → **video_comments** → **comment_likes** → **audition_offers**. All FKs and indexes as in the plan. |

**Tables created by V1 (and relations):**

- **users** — no FK
- **applicant_profiles** — user_id → users
- **business_profiles** — user_id → users
- **auditions** — business_id → users
- **applications** — audition_id → auditions, user_id → users
- **application_photos** — application_id → applications
- **video_contents** — user_id → users
- **creative_assets** — user_id → users
- **video_feedback** — video_id → video_contents, user_id → users
- **video_comments** — video_id → video_contents, parent_comment_id → video_comments, user_id → users
- **comment_likes** — comment_id → video_comments, user_id → users (PK (comment_id, user_id))
- **audition_offers** — audition_id → auditions, business_id → users, user_id → users, video_content_id → video_contents

## 4. Removed modules

- `backend/services/gateway`
- `backend/services/user-service`
- `backend/services/audition-service`
- `backend/services/media-service`
- `backend/libs/common-runtime`
- `backend/libs/common-contract`

The previous parent POM (`backend-parent` with `<modules>`) was replaced by a single-module POM; the only build artifact is `audition-platform-backend` (one JAR).

## 5. Acceptance checklist (PHASE 5)

- **Build:** Backend builds with `./mvnw -DskipTests package` (JAR in `backend/target/`). Frontend builds per Next.js (root `frontend/web`).
- **Runtime:** Backend starts with `SPRING_PROFILES_ACTIVE=production` and valid Postgres URL; no `SchemaManagementException`; Flyway runs and applies V1 on first boot.
- **Health:** `GET /api/health` returns `{"ok":true}`.

Smoke flows (create user, audition, application, media, comment, like) require implementing domain entities, repositories, and controllers in the monolith; see “Remaining TODOs” below.

## 6. Remaining TODOs for later

1. **Domain implementation:** Add JPA entities, repositories, and services for:
   - **user:** User, ApplicantProfile, BusinessProfile (and auth if needed)
   - **audition:** Audition, Application, ApplicationPhoto, AuditionOffer
   - **media:** VideoContent, CreativeAsset, VideoFeedback, VideoComment, CommentLike
   - **admin:** Admin-only endpoints (e.g. under `/api/admin`)
2. **Controllers and DTOs:** Implement REST endpoints for the above (register, create audition, create application, upload/register media, comments, likes). Reuse or recreate DTOs from the old services (e.g. from version control if needed).
3. **Auth:** Wire JWT or session auth and restrict non-health endpoints; currently SecurityConfig permits all for baseline.
4. **Optional:** Test profile with H2 and `ddl-auto=create-drop` for local tests; keep production with `ddl-auto=none` and Flyway only.
