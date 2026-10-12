# Native Architecture (PHASE 3)

applicant-first 네이티브 앱은 `frontend/mobile`에 둔다. 기존 Expo 프로젝트를 확장하며 `apps/mobile`을 새로 만들지 않는다. 새 톱레벨 폴더와 새 상태 enum은 만들지 않는다.

## 위치

- 앱: `frontend/mobile` (Expo SDK 54, Expo Router, TypeScript strict)
- API 클라이언트: `frontend/mobile/src/api` — 웹 `frontend/web/src/shared/api`와 같은 엔드포인트/DTO
- 웹/백엔드: 변경하지 않음. PC 웹은 유지.

## 내비게이션

- Tabs: Home / Auditions / Vote / My Apps / Profile
- Vote는 공개 투표가 핵심 플로우라 탭으로 둔다.
- Stack: Audition Detail / Apply / Vote Board / Ranking / Application Detail / Agency list+detail / Notifications / Web fallback
- Deep link scheme: `globalaudition://` (기존 `app.config.ts`)

## API 재사용

- Base URL: `EXPO_PUBLIC_API_URL` 또는 `${EXPO_PUBLIC_WEB_URL}/api`
- 프로덕션 기본은 기존 Railway 프론트 프록시. 백엔드 도메인을 새로 발명하지 않는다.
- Auth: `Authorization: Bearer` + SecureStore. 웹 localStorage 키와 개념만 같고 저장소만 네이티브다.
- 로그아웃은 SecureStore + React Query 캐시 + 세션 state를 함께 지운다.
- 복구: `POST /auth/recover/identify|reset`, `POST /auth/recovery-requests`. 평문 코드는 발급 응답에만.
- 상태 문자열: `DRAFT|OPEN|CLOSED`, `SUBMITTED|REVIEWING|ACCEPTED|REJECTED`, 보드 `PENDING|REVIEWING|APPROVED|REJECTED` 를 그대로 표시한다.

## 미디어

- 지원 제출 SSOT는 URL (`POST /api/applications.videoUrl`). YouTube/TikTok/Instagram만 허용.
- 네이티브 피커는 참고 UX. 로컬 파일을 메모리에 올려 업로드하지 않는다. 파일 업로드 API가 없기 때문이다.
- 라운드 제출은 기존 `videoUrl` / `fileUrl` / `textAnswer` URL 필드.

## Query

- TanStack Query. staleTime 30s. mutation 후 해당 키 invalidate.
- 서버 상태머신을 클라이언트에서 재구현하지 않는다.

## 플랫폼

- iOS/Android 공통 화면. WebView 폴백은 오디션 생성 등 웹 전용 관리 화면.
- 알림: 공개 GET/FCM 없음. 타입 계약과 빈 화면만.

## 이후 변경 지점

- 엔드포인트 추가: `src/api/endpoints.ts`
- 라벨: `src/domain/statusLabels.ts`
- 화면: `app/`
- 웹 전용 위임 경로: `app/web.tsx`
