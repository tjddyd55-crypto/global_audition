# Deliverables — DB-First Full Reset (20260209_0100)

## 1) Files changed list

**New:**

- `docs/REPO_AUDIT_DB_FIRST.md` — PHASE 0 repo audit (what removed/kept).
- `docs/_archived_legacy/20260209_README.md` — Archive placeholder (legacy already removed).
- `docs/V1_SCHEMA_SUMMARY.md` — V1 schema and index summary.
- `docs/RAILWAY_RESET_RUNBOOK.md` — Step-by-step Railway reset.
- `docs/DELIVERABLES_DB_FIRST_RESET.md` — This file.
- `backend/src/main/resources/db/migration/V1__init.sql` — **Replaced** with UUID-based MVP schema (owner_id, application_id, required indexes).
- `backend/src/main/java/com/audition/platform/domain/user/User.java`
- `backend/src/main/java/com/audition/platform/domain/user/ApplicantProfile.java`
- `backend/src/main/java/com/audition/platform/domain/user/BusinessProfile.java`
- `backend/src/main/java/com/audition/platform/domain/audition/Audition.java`
- `backend/src/main/java/com/audition/platform/domain/audition/Application.java`
- `backend/src/main/java/com/audition/platform/domain/audition/AuditionOffer.java`
- `backend/src/main/java/com/audition/platform/domain/media/VideoContent.java`
- `backend/src/main/java/com/audition/platform/domain/media/CreativeAsset.java`
- `backend/src/main/java/com/audition/platform/domain/media/VideoComment.java`
- `backend/src/main/java/com/audition/platform/domain/media/CommentLike.java`
- `backend/src/main/java/com/audition/platform/domain/media/CommentLikeId.java`
- `backend/src/main/java/com/audition/platform/infra/StartupLoggingListener.java`

**Modified:**

- `backend/src/main/resources/application.yml` — Added `app.version`, `app.buildId`.
- `backend/src/main/java/com/audition/platform/api/HealthController.java` — Added `GET /api/version`.
- `backend/src/main/java/com/audition/platform/infra/SecurityConfig.java` — Permit `/api/version`.

**Unchanged (reference):**

- `backend/pom.xml`, `backend/railway.toml`, `backend/src/.../Application.java`, `backend/src/.../infra/SecurityConfig.java` (except version path), `frontend/web/` (no structural change).

---

## 2) New folder structure summary

```
/
  docs/_archived_legacy/
    20260209_README.md
  backend/
    pom.xml
    mvnw, mvnw.cmd, .mvn/
    railway.toml
    src/main/java/com/audition/platform/
      Application.java
      api/
        HealthController.java
      domain/
        user/       User, ApplicantProfile, BusinessProfile
        audition/   Audition, Application, AuditionOffer
        media/      VideoContent, CreativeAsset, VideoComment, CommentLike, CommentLikeId
        admin/      (package-info)
        common/     (package-info)
      infra/
        SecurityConfig.java
        StartupLoggingListener.java
    src/main/resources/
      application.yml
      application-production.yml
      db/migration/
        V1__init.sql
  frontend/web/
    package.json, src/app/, ...
  docs/
    REPO_AUDIT_DB_FIRST.md
    V1_SCHEMA_SUMMARY.md
    RAILWAY_RESET_RUNBOOK.md
    DELIVERABLES_DB_FIRST_RESET.md
```

No other backend deployables; single JAR from `backend/`.

---

## 3) V1 schema file content summary

See **docs/V1_SCHEMA_SUMMARY.md**.

- **V1__init.sql** creates: users, applicant_profiles, business_profiles, auditions (owner_id), applications, audition_offers (application_id), video_contents, creative_assets, video_comments, comment_likes.
- All PKs UUID; required FKs and minimum indexes as per task. No application_photos or video_feedback in V1.

---

## 4) Railway reset runbook

See **docs/RAILWAY_RESET_RUNBOOK.md**.

- Remove old multi-service deployables (optional).
- Create/use one Postgres (new recommended).
- One Backend service: root `backend`, build `chmod +x mvnw && ./mvnw -DskipTests package`, start `java -jar target/*.jar`, env: `SPRING_PROFILES_ACTIVE=production`, `SPRING_DATASOURCE_*`. Do not set JPA DDL vars.
- One Frontend service: root `frontend/web`, env `NEXT_PUBLIC_API_URL=https://<backend-domain>`.

---

## 5) Known TODOs

- **Build ID / Git SHA:** `/api/version` uses `app.buildId` (empty by default). Optional: add `git-commit-id-plugin` or build-time resource filtering to inject git sha.
- **Auth:** SecurityConfig currently permits all non-health/version paths; restrict to authenticated users once auth is implemented.
- **application_photos / video_feedback:** Not in MVP V1; add in a later Flyway migration if needed.
- **Frontend API base URL:** Project uses `NEXT_PUBLIC_API_URL` (not `NEXT_PUBLIC_API_BASE_URL`); documented in runbook.

---

## PHASE 7 — Acceptance criteria (must pass)

- [x] Backend builds on Railway (root `backend`, Maven package).
- [ ] Backend boots without `SchemaManagementException` (run against empty Postgres with V1).
- [ ] Flyway V1 runs successfully on first boot.
- [ ] `GET /api/health` returns 200 and `{"ok":true}`.
- [ ] No missing table/column errors in logs (verified after deploy with new Postgres).

*(Checklist items marked [ ] to be verified on first Railway deploy.)*
