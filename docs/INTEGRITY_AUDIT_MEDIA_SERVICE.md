# Media-Service Integrity Audit — Findings & Fixes

## 1. INTEGRITY VIOLATIONS FOUND (by layer)

### DATABASE INTEGRITY
| Issue | Severity | Detail |
|-------|----------|--------|
| **Missing V1 migration** | CRITICAL | V3, V4, V5 reference `video_contents`; no migration created that table. Fresh DB → Flyway would fail on V3 (ALTER TABLE video_contents). |
| **Flyway not enabled** | CRITICAL | media-service had no Flyway dependency; with `ddl-auto=none` no schema is created → boot fails on first query or entity load. |
| **V2 index typo** | FIXED (earlier) | `idx_creative_assets_hash` used `file_hash`; column is `content_hash`. Already corrected. |

### ORM / JPA CONFIGURATION
| Issue | Severity | Detail |
|-------|----------|--------|
| **Test profile no ddl-auto** | MEDIUM | application-test.yml had no ddl-auto; with SSOT `none`, H2 in-memory had no schema → tests could fail. |

### API ↔ DB / BUILD / UI
- No violations found in repositories, DTOs, or frontend contracts for media-service scope.
- Build/runtime path issues (Root=backend, mvnw permission, /app/target) are environment/config and documented in conversation; no code change in this audit.

---

## 2. CHANGES APPLIED

### 2.1 Database: Add V1 migration
- **File:** `backend/services/media-service/src/main/resources/db/migration/V1__Create_video_contents.sql`
- **Content:** Creates `video_contents` with columns matching `VideoContent` entity (before V3 adds `video_type`, `visibility`): id, user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count, comment_count, category, status, created_at, updated_at. Indexes on user_id, category, status.
- **Why:** V3/V4/V5 depend on `video_contents` existing. Without V1, Flyway chain is broken on fresh DB.

### 2.2 Enable Flyway at runtime
- **File:** `backend/services/media-service/pom.xml`
- **Change:** Added dependencies: `flyway-core`, `flyway-database-postgresql`.
- **Why:** With `ddl-auto=none`, Hibernate does not create or validate schema. Flyway runs on boot and applies V1–V6, creating all tables so the app can start and run without schema validation errors.

### 2.3 Test profile: restore create-drop for H2
- **File:** `backend/services/media-service/src/test/resources/application-test.yml`
- **Change:** Restored `jpa.hibernate.ddl-auto: create-drop` (with comment that SSOT remains application.yml; test-only override).
- **Why:** H2 in-memory needs schema created each run; otherwise tests that touch entities fail.

---

## 3. WHY THIS FIXES THE CRASH

1. **Hibernate no longer validates schema**  
   `ddl-auto=none` (and `hbm2ddl.auto=none`) means EntityManagerFactory creation does not run schema validation, so “missing table” never happens at ORM init.

2. **Schema is created by Flyway**  
   On first boot against an empty (or missing-table) DB, Flyway runs V1→V6 in order, creating `video_contents`, `creative_assets`, then adding columns (V3), then `video_feedback`, `video_comments`, `comment_likes`. All entities then have backing tables.

3. **Boot sequence is safe**  
   Config load → DataSource → Flyway (migrate) → JPA (no ddl) → API ready. No step depends on Hibernate creating or validating tables.

---

## 4. CONFIRMATION CHECKLIST

After deploy:

- [ ] Application starts without `Schema-validation: missing table` or similar.
- [ ] Log shows `🔥 Hibernate ddl-auto in EFFECT = none`.
- [ ] Flyway logs show successful migration (e.g. “Migrating schema to version V1 - Create video contents” through V6).
- [ ] No missing table/column errors in runtime logs.
- [ ] Health/actuator and key media APIs respond (e.g. list videos, vault assets).

---

## 5. ENTITY ↔ TABLE MAPPING (verified)

| Entity        | Table           | Migration |
|---------------|-----------------|-----------|
| VideoContent  | video_contents  | V1, V3 (adds video_type, visibility) |
| CreativeAsset | creative_assets | V2 |
| VideoFeedback | video_feedback  | V4 |
| VideoComment  | video_comments  | V5 |
| CommentLike   | comment_likes   | V6 |

All columns in entities match migration DDL (names and types). No API/UI contract mismatches were found in the audited scope.
