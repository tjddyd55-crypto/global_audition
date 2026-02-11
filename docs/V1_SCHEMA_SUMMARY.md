# V1 schema summary and rationale

**File:** `backend/src/main/resources/db/migration/V1__init.sql`  
**Authority:** Flyway only; production uses `spring.jpa.hibernate.ddl-auto=none`.

---

## Design choices

- **UUID primary keys** for all root entities (users, auditions, applications, audition_offers, video_contents, creative_assets, video_comments). Rationale: stable identifiers across environments, no sequence clashes, task requirement.
- **auditions.owner_id** (not business_id) → `users.id`: single owner per audition (agency/business user).
- **audition_offers.application_id** → `applications.id`: offer is tied to an application; task-required relation.
- **comment_likes** composite PK `(comment_id, user_id)` with UNIQUE implied by PK; indexes on `comment_id` and `user_id` for lookups.

---

## Tables and relations

| Table | PK | Relations (FK) |
|------|-----|----------------|
| users | id (UUID) | — |
| applicant_profiles | user_id (UUID) | user_id → users.id |
| business_profiles | user_id (UUID) | user_id → users.id |
| auditions | id (UUID) | owner_id → users.id |
| applications | id (UUID) | audition_id → auditions.id, user_id → users.id |
| audition_offers | id (UUID) | application_id → applications.id |
| video_contents | id (UUID) | user_id → users.id |
| creative_assets | id (UUID) | user_id → users.id |
| video_comments | id (UUID) | video_id → video_contents.id, user_id → users.id, parent_comment_id → video_comments.id |
| comment_likes | (comment_id, user_id) | comment_id → video_comments.id, user_id → users.id |

---

## Indexes (minimum required)

| Table | Index | Purpose |
|-------|--------|--------|
| video_contents | (user_id, created_at) | List by owner and time |
| creative_assets | (user_id, created_at) | List by owner and time |
| video_comments | (video_id, created_at) | List by video and time |
| applications | (audition_id, created_at) | List by audition and time |
| auditions | (owner_id, created_at) | List by owner and time |
| comment_likes | (comment_id) | Lookup by comment |
| comment_likes | (user_id) | Lookup by user |

Additional indexes in V1: users (email, user_type, deleted_at), applicant_profiles/business_profiles (via PK), auditions (status, category), applications (user_id, unique user_id+audition_id), audition_offers (application_id), video_contents (category, status), creative_assets (content_hash).

---

## Omitted from V1 (task MVP only)

- **application_photos** — not in required MVP list; can be added in a later migration if needed.
- **video_feedback** — not in required MVP list; can be added in a later migration if needed.
