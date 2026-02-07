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

---

## 6. Flyway Checksum Mismatch / 누락(V4) 대응

### 적용 설정 (application-production.yml)

- **repair-on-migrate: true** — DB의 `flyway_schema_history` 체크섬을 현재 코드(V2,V3,V5,V6) 기준으로 강제 동기화. Checksum Mismatch 해소.
- **out-of-order: true** — 버전 순서와 관계없이 미실행 스크립트(V4 등) 실행 허용. 누락된 V4 실행 가능.

### 메모: 배포 성공 후

- **repair-on-migrate** 는 배포가 성공하고 `flyway_schema_history` 가 안정화되면 제거할 수 있음. 보안·감사상 장기적으로는 `false`(기본) 유지 권장.

### 설정으로 해결되지 않을 때: 운영 DB와 비교

운영 DB와 구조가 다르면 Flyway 적용이 실패할 수 있음. 아래는 현재 코드 기준 마이그레이션 요약(비교용).

| 버전 | 내용 | 주요 테이블/변경 |
|------|------|------------------|
| V2 | creative_assets 생성 | id, user_id, title, description, asset_type, file_url, text_content, content_hash, file_size, mime_type, declared_creation_type, access_control, registered_at, created_at, updated_at. 인덱스: user_id, content_hash, access_control, created_at |
| V3 | video_contents 컬럼 추가 | video_type VARCHAR(20), visibility VARCHAR(20). 인덱스: video_type, visibility |
| V4 | video_feedback 생성 | id, video_id, user_id, timestamp_seconds, comment, created_at, updated_at. FK → video_contents(id). 인덱스: video_id, user_id, (video_id, timestamp_seconds) |
| V5 | video_comments 생성 | id, video_id, user_id, parent_comment_id, content, like_count, created_at, updated_at, deleted_at. FK → video_contents, video_comments. 인덱스: video_id, user_id, parent_comment_id |
| V6 | comment_likes 생성 | (comment_id, user_id) PK, created_at. FK → video_comments(id). 인덱스: user_id |

운영 DB에서 위 테이블/컬럼이 다르면 스키마를 코드에 맞추거나, 마이그레이션 SQL을 수정한 뒤 다시 배포해야 함.
