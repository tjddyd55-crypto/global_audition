# Monolith Reset — Current vs Target (PHASE 0)

## Pre-reset structure (reference)

| Path | Role |
|------|------|
| `backend/pom.xml` | Parent POM (backend-parent), packaging pom, **no runnable app** |
| `backend/services/gateway` | Spring Cloud Gateway (separate deployable) |
| `backend/services/user-service` | User/auth microservice (JAR) |
| `backend/services/audition-service` | Audition/applications/offers microservice (JAR) |
| `backend/services/media-service` | Media/videos/creative_assets/comments (JAR) |
| `backend/libs/common-runtime` | Shared library |
| `backend/libs/common-contract` | Shared library |
| `frontend/web` | Next.js app (single) |
| `backend/railway.toml` | Builds media-service only, copies to target/ |

**Build/deploy today:** Multi-module Maven; Railway builds one service (e.g. media-service) with custom buildCommand copying JAR to `target/`. No single backend JAR at `backend/target/`.

---

## Target structure

| Path | Role |
|------|------|
| `backend/pom.xml` | **Single** Spring Boot app (packaging jar), one build → `backend/target/*.jar` |
| `backend/src/main/java/com/audition/platform/` | Single codebase: domain/{audition, media, user, admin, common}, api, infra, Application.java |
| `backend/src/main/resources/application.yml` | ddl-auto=none, Flyway only |
| `backend/src/main/resources/db/migration/V1__init.sql` | One baseline: all MVP tables |
| `frontend/web` | Unchanged (single Next.js) |

**Build/deploy target:** Root=backend, `./mvnw -DskipTests package` → `target/*.jar`, `java -jar target/*.jar`.

---

## Plan summary (before destructive changes)

1. **Keep**
   - `frontend/web` (no change).
   - Repo root files: `.gitignore`, `README.md`, `docs/` (scripts under `docs/scripts`), etc.

2. **Remove / archive**
   - `backend/services/gateway`
   - `backend/services/user-service`
   - `backend/services/audition-service`
   - `backend/services/media-service`
   - `backend/libs/common-runtime`
   - `backend/libs/common-contract`
   - Current `backend/pom.xml` (replaced by single-module POM).

3. **Add / replace**
   - New `backend/pom.xml`: single module, spring-boot-starter-* (web, data-jpa, validation, security), flyway-core, postgresql, jjwt, springdoc, actuator.
   - New `backend/src/main/java/.../Application.java`.
   - New `backend/src/main/java/.../domain/{audition, media, user, admin, common}` (entities/repos merged from the three services).
   - New `backend/src/main/java/.../api` (controllers, DTOs).
   - New `backend/src/main/java/.../infra` (security, JPA config, Flyway).
   - New `backend/src/main/resources/application.yml` and `application-production.yml` (ddl-auto=none, Flyway, datasource).
   - New `backend/src/main/resources/db/migration/V1__init.sql` (users, applicant_profiles, business_profiles, auditions, applications, application_photos, audition_offers, video_contents, creative_assets, video_feedback, video_comments, comment_likes).
   - Health: `GET /api/health` → `{"ok":true}`.
   - `backend/railway.toml`: buildCommand = `chmod +x mvnw && ./mvnw -DskipTests package`, startCommand = `java -jar target/*.jar`.
   - `backend/mvnw` + `.mvn/` (copy from one of the services).

4. **Railway**
   - Backend: Root = `backend`, build = `chmod +x mvnw && ./mvnw -DskipTests package`, start = `java -jar target/*.jar`, env = SPRING_PROFILES_ACTIVE=production, SPRING_DATASOURCE_*.
   - Frontend: Root = `frontend/web`, NEXT_PUBLIC_API_BASE_URL = backend URL.

---

## MVP tables (V1__init.sql) — order and FKs

1. **users** (no FK)
2. **applicant_profiles** (user_id → users)
3. **business_profiles** (user_id → users)
4. **auditions** (business_id → users)
5. **applications** (audition_id → auditions, user_id → users), **application_photos** (application_id → applications)
6. **video_contents** (user_id, no FK constraint for simplicity or FK → users)
7. **creative_assets** (user_id)
8. **video_feedback** (video_id → video_contents)
9. **video_comments** (video_id → video_contents, parent_comment_id → video_comments)
10. **comment_likes** (comment_id → video_comments)
11. **audition_offers** (audition_id → auditions, user_id → users, business_id → users, video_content_id → video_contents)

---

## Completed (PHASE 1–6)

- **PHASE 1:** Single backend layout; `services/`, `libs/` removed; single `pom.xml`, `mvnw`, Application, infra.
- **PHASE 2:** Monolith baseline: domain package layout (user, audition, media, admin, common), `GET /api/health`, SecurityConfig.
- **PHASE 3:** `V1__init.sql` baseline, `application.yml` / `application-production.yml` with `ddl-auto=none`, Flyway enabled.
- **PHASE 4:** `backend/railway.toml` updated; Railway instructions in `docs/MONOLITH_RESET_DELIVERABLES.md`.
- **PHASE 5–6:** Deliverables doc: folder tree, Railway setup, migration list, removed modules, TODOs.

See **docs/MONOLITH_RESET_DELIVERABLES.md** for final tree, Railway config, and remaining TODOs (domain entities, controllers, auth).
