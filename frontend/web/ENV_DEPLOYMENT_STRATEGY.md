# ENV / 배포 전략 문서

## 개요

Frontend에서 사용하는 환경 변수를 체계적으로 관리하여, ENV 누락으로 인한 빌드 실패를 완전히 방지합니다.

## ENV 분류

### NEXT_PUBLIC_* (Client-Side Accessible)

**특징**:
- 클라이언트 사이드에서 접근 가능
- 빌드 타임에 하드코딩됨
- 브라우저에서 노출됨 (민감한 정보 포함 금지)

**사용 위치**: `src/lib/env.ts`에서 가드 처리

### Server-Only ENV

**특징**:
- 서버 사이드에서만 접근 가능
- 클라이언트 코드에서 접근 금지
- Next.js API Routes, Server Components에서만 사용

**현재 Frontend에서 사용 없음** (Backend 전용)

## 필수 ENV 목록

### 1. NEXT_PUBLIC_API_URL (필수)

**용도**: API Gateway Base URL

**설정 위치**:
- Railway: `frontend-web` 서비스 → Variables
- 로컬: `.env.local` (gitignore)

**값 예시**:
```
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
```

**빌드 타임 가드**: `src/lib/env.ts`에서 검증
- 누락 시 빌드 즉시 실패
- 명확한 에러 메시지 제공

**사용 방법**:
```typescript
import { API_BASE_URL } from '@/lib/env'
// ❌ 금지: process.env.NEXT_PUBLIC_API_URL 직접 사용
```

### 2. NEXT_PUBLIC_LOCALE (선택)

**용도**: 기본 로케일 설정

**기본값**: `'ko'`

**설정 위치**: Railway Variables 또는 `.env.local`

**값 예시**:
```
NEXT_PUBLIC_LOCALE=ko
```

**사용 방법**:
```typescript
import { DEFAULT_LOCALE } from '@/lib/env'
```

### 3. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (선택)

**용도**: Stripe 결제 기능 (현재 미사용)

**설정 위치**: Railway Variables 또는 `.env.local`

**값 예시**:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**사용 방법**:
```typescript
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/env'
```

## 빌드 타임 가드

### 위치: `src/lib/env.ts`

**구현**:
- 즉시 실행 함수(IIFE)로 빌드 타임에 검증
- 누락 시 `throw new Error()`로 빌드 실패
- 명확한 에러 메시지 제공

**현재 가드 대상**:
- ✅ `NEXT_PUBLIC_API_URL` (필수)

**가드 미적용** (기본값 제공):
- `NEXT_PUBLIC_LOCALE` (기본값: 'ko')
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (기본값: '')

## ENV 사용 규칙

### ✅ 올바른 사용

```typescript
// 1. env.ts에서 import
import { API_BASE_URL } from '@/lib/env'

// 2. 사용
const response = await fetch(`${API_BASE_URL}/api/v1/endpoint`)
```

### ❌ 잘못된 사용

```typescript
// 1. process.env 직접 사용 금지
const url = process.env.NEXT_PUBLIC_API_URL  // ❌

// 2. 클라이언트에서 server-only ENV 접근 금지
const dbUrl = process.env.DATABASE_URL  // ❌
```

## Railway 배포 전략

### 필수 설정

**Railway Dashboard**:
1. `frontend-web` 서비스 선택
2. Variables 탭 이동
3. 다음 변수 설정:

```
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
```

### 선택 설정

```
NEXT_PUBLIC_LOCALE=ko
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### 검증 방법

**빌드 로그 확인**:
- `NEXT_PUBLIC_API_URL is not defined` 오류 없음
- `Compiled successfully` 확인

## 로컬 개발 전략

### .env.local (gitignore)

**위치**: `frontend/web/.env.local`

**내용**:
```env
# 필수
NEXT_PUBLIC_API_URL=http://localhost:8080

# 선택
NEXT_PUBLIC_LOCALE=ko
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**주의**: `.env.local`은 git에 커밋하지 않음

### 기본값 사용

`next.config.js`에서 기본값 제공:
- `NEXT_PUBLIC_API_URL`: 개발용 Gateway URL
- `NEXT_PUBLIC_LOCALE`: 'ko'

**주의**: Railway에서는 기본값에 의존하지 않고 명시적으로 설정 필요

## ENV 누락 시 동작

### 빌드 타임

**NEXT_PUBLIC_API_URL 누락**:
```
Error: NEXT_PUBLIC_API_URL is not defined.
Please set NEXT_PUBLIC_API_URL in Railway Variables.
Example: https://gateway-production-72d6.up.railway.app
```

**결과**: 빌드 즉시 실패

### 런타임

**NEXT_PUBLIC_LOCALE 누락**:
- 기본값 'ko' 사용
- 빌드 성공

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 누락**:
- 기본값 '' 사용
- 빌드 성공
- Stripe 기능 비활성화

## 재발 방지 전략

### 1. 빌드 타임 가드

- `src/lib/env.ts`에서 필수 ENV 검증
- 누락 시 즉시 빌드 실패

### 2. ENV 사용 규칙

- `process.env.NEXT_PUBLIC_*` 직접 사용 금지
- `src/lib/env.ts`에서만 ENV 접근

### 3. 문서화

- 필수 ENV 목록 명시
- Railway 설정 가이드 제공
- 로컬 개발 가이드 제공

### 4. 코드 리뷰 체크리스트

- [ ] `process.env.NEXT_PUBLIC_*` 직접 사용 없음
- [ ] `src/lib/env.ts`에서 ENV 접근
- [ ] 필수 ENV 가드 적용됨

## 관련 파일

### ENV 관리
- `frontend/web/src/lib/env.ts` - ENV 가드 모듈 (SSOT)
- `frontend/web/next.config.js` - Next.js ENV 설정

### 문서
- `frontend/web/ENV_SETUP.md` - ENV 설정 가이드
- `frontend/web/ENV_DEPLOYMENT_STRATEGY.md` - 이 문서

### 설정 파일
- `.env.local` - 로컬 개발용 (gitignore)
- Railway Variables - 프로덕션 배포용

## 문제 해결

### 빌드 실패: "NEXT_PUBLIC_API_URL is not defined"

**원인**: Railway Variables에 설정되지 않음

**해결**:
1. Railway Dashboard → `frontend-web` → Variables
2. `NEXT_PUBLIC_API_URL` 추가
3. 값 설정: `https://gateway-production-72d6.up.railway.app`
4. 재배포

### 빌드 성공했는데 API 호출 실패

**원인**: ENV 값이 잘못되었거나 빈 문자열

**해결**:
1. Railway Variables에서 값 확인
2. 빈 문자열이 아닌지 확인
3. 올바른 Gateway URL인지 확인

## 다음 단계

- [ ] 모든 ENV 사용을 `src/lib/env.ts`로 통합
- [ ] 추가 필수 ENV 가드 추가 (필요시)
- [ ] ENV 검증 테스트 추가
