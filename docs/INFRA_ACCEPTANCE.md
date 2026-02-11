# 인프라/플랫폼 단계 종료 조건

## STEP 2 — API 헬스 체크 (30초)

백엔드 + DB 완료 조건:

| 요청 | 기대 응답 |
|------|------------|
| `GET /api/health` | `{ "ok": true }` |
| `GET /api/version` | `{ "version": "...", "buildId": "..." }` (version 노출) |

→ 두 개 나오면 **백엔드+DB** 단계 완료.

## STEP 3 — Frontend 연결 확인

- **API base URL:** `NEXT_PUBLIC_API_URL` (프론트엔드 `src/lib/env.ts`에서 사용)
- Frontend에서 **health/version 호출 성공** 시:
  - 대시보드 **API 연결 상태** 카드에 "Backend (API) ✓ 정상" 및 version 표시
  - `src/lib/api/health.ts`: `checkBackendHealth()`, `getBackendVersion()`, `checkBackendHealthAndVersion()`

→ 여기까지면 **인프라/플랫폼 단계 종료**.

## 체크리스트

- [ ] Backend 배포 후 `GET <backend-url>/api/health` → `{"ok":true}`
- [ ] Backend 배포 후 `GET <backend-url>/api/version` → version 노출
- [ ] Railway Frontend에 `NEXT_PUBLIC_API_URL=https://<backend-domain>` 설정
- [ ] 로그인 후 대시보드에서 "Backend (API) ✓ 정상" 및 version 확인
