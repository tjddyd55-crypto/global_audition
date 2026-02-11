# Frontend ↔ Media-Service ↔ Gateway 통합 안정화 (Phase A) 완료 보고

## 개요

Phase A는 실제 기능 변경 없이 구조적 검증과 문서화만 수행했습니다.
모든 작업이 완료되었으며, Phase B (실제 기능 실행) 준비가 완료되었습니다.

## 완료된 TASK

### TASK 1️⃣: Frontend ↔ Media-Service API 실제 호출 검증 (Read-only)

**완료 내용**:
- ✅ Health Check API 추가 (`src/lib/api/health.ts`)
- ✅ Dashboard 페이지에 API 연결 상태 표시
- ✅ GET 요청만 사용하여 안전하게 검증
- ✅ CORS 오류 없음 확인
- ✅ timeout/500 오류 처리 포함

**생성 파일**:
- `frontend/web/src/lib/api/health.ts`

**수정 파일**:
- `frontend/web/src/app/[locale]/my/dashboard/page.tsx`

---

### TASK 2️⃣: 파일 업로드 / 미디어 플로우 점검

**완료 내용**:
- ✅ 업로드 플로우 3단계 문서화
- ✅ Frontend Validation TODO 주석 추가
- ✅ Media-Service Storage Provider 정보 주석 추가
- ✅ 실제 파일 업로드 실행 없음

**생성 파일**:
- `docs/FILE_UPLOAD_FLOW.md`

**수정 파일**:
- `frontend/web/src/lib/api/vault.ts`
- `frontend/web/src/app/[locale]/vault/page.tsx`
- `backend/services/media-service/.../CreativeAssetController.java`
- `backend/services/media-service/.../MediaController.java`
- `backend/services/media-service/.../FileStorageService.java`

---

### TASK 3️⃣: Gateway 경유 구조 정합성 검증

**완료 내용**:
- ✅ Gateway 라우팅 현황 확인
- ✅ Frontend 호출 방식 확인
- ✅ Endpoint 상수화 완료
- ✅ Gateway 전환 가능 구조 확보
- ✅ 실제 라우팅 변경 없음

**생성 파일**:
- `frontend/web/src/lib/api/endpoints.ts`
- `docs/GATEWAY_ROUTING_STATUS.md`

**수정 파일**:
- `frontend/web/src/lib/api/videos.ts`
- `frontend/web/src/lib/api/vault.ts`
- `frontend/web/src/lib/api/health.ts`

---

### TASK 4️⃣: ENV / 배포 전략 정리

**완료 내용**:
- ✅ process.env. 전수 검색 완료
- ✅ NEXT_PUBLIC_* vs server-only ENV 구분 확인
- ✅ 필수 ENV 목록 문서화
- ✅ 빌드 타임 가드 확인 및 강화
- ✅ ENV 누락 시 명확한 에러 메시지 확인

**생성 파일**:
- `frontend/web/ENV_REQUIRED.md`
- `frontend/web/ENV_DEPLOYMENT_STRATEGY.md`

**수정 파일**:
- `frontend/web/src/lib/env.ts` (문서화 강화)

---

## ENV 현황 요약

### 필수 ENV

| ENV | 필수 여부 | 빌드 타임 가드 | 기본값 |
|-----|---------|--------------|--------|
| `NEXT_PUBLIC_API_URL` | ✅ 필수 | ✅ 적용됨 | 없음 (빌드 실패) |

### 선택 ENV

| ENV | 필수 여부 | 빌드 타임 가드 | 기본값 |
|-----|---------|--------------|--------|
| `NEXT_PUBLIC_LOCALE` | 선택 | ❌ 없음 | `'ko'` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 선택 | ❌ 없음 | `''` |

### ENV 사용 규칙

- ✅ `src/lib/env.ts`에서만 ENV 접근 (SSOT)
- ❌ `process.env.NEXT_PUBLIC_*` 직접 사용 금지
- ✅ `process.env.NODE_ENV`는 런타임 체크용으로 허용

---

## Gateway 라우팅 현황

| 엔드포인트 | Gateway 라우팅 | Frontend 상수화 | 전환 가능 |
|-----------|---------------|----------------|----------|
| `/api/v1/videos/**` | ✅ 설정됨 | `MEDIA_ENDPOINTS.VIDEOS` | ✅ 가능 |
| `/api/v1/vault/**` | ❌ 미설정 | `MEDIA_ENDPOINTS.VAULT` | ✅ 가능 (라우팅 추가 후) |
| `/api/v1/media/**` | ❌ 미설정 | `MEDIA_ENDPOINTS.MEDIA` | ✅ 가능 (라우팅 추가 후) |

---

## 파일 업로드 플로우

### 3단계 플로우

1. **Frontend**: 파일 선택 및 Validation
   - 위치: `src/app/[locale]/vault/page.tsx`
   - TODO: 파일 크기/확장자/MIME 체크 추가 필요

2. **Frontend → Media-Service**: Upload 요청
   - 위치: `src/lib/api/vault.ts`
   - 방법: FormData + multipart/form-data
   - 엔드포인트: `POST /api/v1/vault/assets`

3. **Media-Service**: Storage 처리
   - Storage Provider: Local File System
   - 파일 크기 제한: 50MB
   - 확장자 검증: FileStorageService에서 수행

---

## 재발 방지 전략

### ENV 누락 방지

1. **빌드 타임 가드**: `src/lib/env.ts`에서 필수 ENV 검증
2. **ENV 사용 규칙**: `process.env.NEXT_PUBLIC_*` 직접 사용 금지
3. **문서화**: 필수 ENV 목록 명시
4. **Railway 설정 가이드**: 배포 전 체크리스트 제공

### Gateway 전환 가능 구조

1. **Endpoint 상수화**: 모든 엔드포인트를 `MEDIA_ENDPOINTS`로 관리
2. **Gateway 전환 플래그**: `USE_GATEWAY`로 전환 가능 여부 표시
3. **문서화**: Gateway 라우팅 현황 및 전환 방법 가이드

---

## 생성된 문서

1. `docs/FILE_UPLOAD_FLOW.md` - 파일 업로드 플로우 문서화
2. `docs/GATEWAY_ROUTING_STATUS.md` - Gateway 라우팅 현황
3. `docs/PHASE_A_SUMMARY.md` - 이 문서
4. `frontend/web/ENV_REQUIRED.md` - 필수 ENV 목록
5. `frontend/web/ENV_DEPLOYMENT_STRATEGY.md` - ENV 배포 전략
6. `frontend/web/ENV_SETUP.md` - ENV 설정 가이드 (기존)

---

## 다음 단계 (Phase B)

- [ ] Frontend Validation 구현
- [ ] 실제 파일 업로드 테스트
- [ ] Gateway에 추가 라우팅 설정
- [ ] 실제 API 호출 테스트 (POST/PUT/DELETE)
- [ ] 에러 처리 강화

---

## 공통 금지 사항 준수

- ✅ 실제 데이터 변경 API 호출 없음
- ✅ 업로드 실행 없음
- ✅ DB write 없음
- ✅ gateway 라우팅 강제 변경 없음
- ✅ 배포 설정 변경 없음

---

## 종료 조건 달성

- ✅ 4개 TASK 모두 에러 없이 정리
- ✅ 실제 기능 변경 최소화
- ✅ Phase B 준비 완료

Phase A 작업이 모두 완료되었습니다.
