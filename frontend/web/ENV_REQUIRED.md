# 필수 ENV 목록

## Required ENV

### NEXT_PUBLIC_API_URL (필수)

**용도**: API Gateway Base URL

**설정 위치**:
- Railway: `frontend-web` 서비스 → Variables
- 로컬: `.env.local` (gitignore)

**값 예시**:
```
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
```

**빌드 타임 가드**: ✅ 적용됨 (`src/lib/env.ts`)
- 누락 시 빌드 즉시 실패
- 명확한 에러 메시지 제공

**에러 메시지**:
```
Error: NEXT_PUBLIC_API_URL is not defined.
Please set NEXT_PUBLIC_API_URL in Railway Variables.
Example: https://gateway-production-72d6.up.railway.app
```

## Optional ENV

### NEXT_PUBLIC_LOCALE (선택)

**용도**: 기본 로케일 설정

**기본값**: `'ko'`

**설정 위치**: Railway Variables 또는 `.env.local`

**값 예시**:
```
NEXT_PUBLIC_LOCALE=ko
```

**빌드 타임 가드**: ❌ 없음 (기본값 제공)

### NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (선택)

**용도**: Stripe 결제 기능 (현재 미사용)

**기본값**: `''`

**설정 위치**: Railway Variables 또는 `.env.local`

**값 예시**:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**빌드 타임 가드**: ❌ 없음 (기본값 제공)

## ENV 사용 규칙

### ✅ 올바른 사용

```typescript
// src/lib/env.ts에서 import
import { API_BASE_URL } from '@/lib/env'

// 사용
const response = await fetch(`${API_BASE_URL}/api/v1/endpoint`)
```

### ❌ 잘못된 사용

```typescript
// process.env 직접 사용 금지
const url = process.env.NEXT_PUBLIC_API_URL  // ❌

// 클라이언트에서 server-only ENV 접근 금지
const dbUrl = process.env.DATABASE_URL  // ❌
```

## Railway 배포 체크리스트

배포 전 확인:
- [ ] `NEXT_PUBLIC_API_URL` 설정됨
- [ ] 값이 빈 문자열 아님
- [ ] 올바른 Gateway URL 형식

## 로컬 개발 체크리스트

로컬 개발 전 확인:
- [ ] `.env.local` 파일 생성 (선택)
- [ ] `NEXT_PUBLIC_API_URL` 설정 (선택, 기본값 사용 가능)
