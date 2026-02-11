# MVP Audition Flow — Implementation Deliverable

## 1) Execution plan (short)

- **Backend:** Kept existing auth (signup/login, BCrypt, JWT), entities, and Flyway V1 schema. Added GET `/api/auditions/mine` (AGENCY/ADMIN), PATCH `/api/applications/:id/status` with body `{ status }` (REVIEWED|ACCEPTED|REJECTED), duplicate apply → 409 CONFLICT, optional `CreateAuditionRequest.status`, global exception handler for JSON `{ "message": "..." }`, and CORS for frontend origin.
- **Frontend:** My auditions now call GET `/api/auditions/mine` (no client-side filter). Accept/Reject use PATCH `/api/applications/:id/status`. Apply flow handles 409 with "이미 지원하셨습니다" on desktop and mobile.
- **Single source of truth:** DB (users.role, auditions.status, applications.status) ↔ backend DTOs (camelCase in JSON) ↔ frontend types; no schema change.

---

## 2) File list (create/modify)

### Backend (create)
- `backend/src/main/java/com/audition/platform/api/dto/UpdateApplicationStatusRequest.java`
- `backend/src/main/java/com/audition/platform/api/GlobalExceptionHandler.java`
- `backend/src/main/java/com/audition/platform/infra/CorsConfig.java`

### Backend (modify)
- `backend/src/main/java/com/audition/platform/api/AuditionController.java` — add GET `/mine`
- `backend/src/main/java/com/audition/platform/application/AuditionService.java` — add `listMine()`
- `backend/src/main/java/com/audition/platform/api/dto/CreateAuditionRequest.java` — status optional (remove `@NotBlank` from status)
- `backend/src/main/java/com/audition/platform/application/ApplicationService.java` — duplicate apply → 409; add `updateStatus(id, status)`; accept/reject call it
- `backend/src/main/java/com/audition/platform/api/ApplicationController.java` — add PATCH `/applications/{id}/status`; keep POST accept/reject
- `backend/src/main/java/com/audition/platform/infra/SecurityConfig.java` — enable `.cors(cors -> {})`
- `backend/src/main/resources/application.yml` — add `app.cors.allowed-origins`

### Frontend (modify)
- `frontend/web/src/lib/api/auditions.ts` — `getMyAuditions` → GET `/auditions/mine`
- `frontend/web/src/lib/api/applications.ts` — `accept`/`reject` → PATCH with `{ status }`; add `updateStatus`
- `frontend/web/src/app/[locale]/auditions/[id]/page.tsx` — 409 → "이미 지원하셨습니다"
- `frontend/web/src/app/[locale]/auditions/[id]/apply/page.tsx` — 409 → "이미 지원하셨습니다"
- `frontend/web/src/app/(mobile)/auditions/[id]/apply/page.tsx` — error state + 409 message

### Not changed
- `backend/src/main/resources/db/migration/V1__init.sql` — unchanged (no schema change).

---

## 3) API / DB alignment

| Source | users.role | auditions.status | applications.status |
|--------|------------|------------------|---------------------|
| DB (V1) | APPLICANT, AGENCY, ADMIN | DRAFT, OPEN, CLOSED | SUBMITTED, REVIEWED, ACCEPTED, REJECTED |
| Backend DTOs | Same (AuthResponse.role) | Same (AuditionResponse) | Same (ApplicationResponse) |
| Frontend types | Same | DRAFT \| OPEN \| CLOSED | SUBMITTED \| REVIEWED \| ACCEPTED \| REJECTED |

JSON field names: camelCase (userId, ownerId, createdAt, auditionId, applicantId) — backend uses Java getters; frontend types use same names.

---

## 4) How to run + verify

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
- Default: port 8080, Postgres `localhost:5432/audition` (user/pass from `application.yml`).
- Flyway runs on startup and applies `V1__init.sql` if not already applied.

### Frontend
```bash
cd frontend/web
npm install
npm run dev
```
- Set `NEXT_PUBLIC_API_URL=http://localhost:8080` (or your backend URL) in `.env.local`.
- App: http://localhost:3000 (desktop). Mobile routes: same host (e.g. `/auditions/[id]`, `/auditions/[id]/apply`).

### Test scenario (end-to-end)
1. **Signup (APPLICANT)** — e.g. `/signup` or `/register`: email, password, role APPLICANT → redirect to auditions/home; token + userRole + userId in localStorage.
2. **Signup (AGENCY)** — role AGENCY → redirect to `/my/dashboard`; can open `/auditions/create` or `/auditions/new`.
3. **Login** — POST `/api/auth/login` → same token/role/userId; APPLICANT → home, AGENCY/ADMIN → dashboard.
4. **Create audition** — AGENCY/ADMIN: POST `/api/auditions` with title, description, status (DRAFT|OPEN|CLOSED). Create one with status OPEN.
5. **List auditions** — GET `/api/auditions`; list and detail pages show OPEN/DRAFT/CLOSED correctly.
6. **My auditions** — AGENCY: GET `/api/auditions/mine`; "내 오디션 관리" shows only own auditions (no localStorage filter).
7. **Apply** — APPLICANT: on audition detail (OPEN), click "지원하기" → POST `/api/auditions/:id/apply` → one application per user per audition; redirect to dashboard/applications or similar.
8. **Duplicate apply** — Same user applies again → 409; UI shows "이미 지원하셨습니다."
9. **Review applications** — Owner: open `/auditions/:id/applications`; GET `/api/auditions/:id/applications`; list with Accept/Reject.
10. **Accept/Reject** — Owner: Accept/Reject call PATCH `/api/applications/:id/status` with `{ "status": "ACCEPTED" }` or `"REJECTED"`; list refreshes; status shown (e.g. "Accepted 🎉").
11. **My applications** — APPLICANT: GET `/api/applications/me`; dashboard/applications shows list with status (SUBMITTED/REVIEWED/ACCEPTED/REJECTED).

---

## 5) Fallback SQL (only if Flyway cannot run)

If Flyway does not run (e.g. no DB at first start), create the DB and run this **once** in DBeaver (or psql) against your Postgres DB:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('APPLICANT','AGENCY','ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE auditions (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','OPEN','CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','REVIEWED','ACCEPTED','REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (audition_id, applicant_id)
);

CREATE INDEX idx_auditions_owner ON auditions(owner_id);
CREATE INDEX idx_applications_audition ON applications(audition_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
```

After that, either point the app at this DB and let Flyway run (it will see existing objects and not re-create them if configured to skip or use baseline), or disable Flyway and run the app. Prefer fixing Flyway so this is not needed.

---

## What I (the user) must do

1. **Backend:** Ensure Postgres is running and `application.yml` (or env) has correct `spring.datasource.url`, `username`, `password`. Run `./mvnw spring-boot:run` from `backend/`.
2. **Frontend:** Create `frontend/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8080`. Run `npm run dev` from `frontend/web/`.
3. **Optional:** If the DB is empty and Flyway did not apply migrations, run the SQL in section 5 once against your database, then start the backend again.
4. **Verify:** Follow the test scenario above (signup → login → create audition → apply → duplicate 409 → accept/reject → my applications).

No manual DB edits are required if Flyway runs successfully on first backend start.
