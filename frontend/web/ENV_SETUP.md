# 환경 변수 설정 가이드

## Railway Variables 필수 설정

Railway Dashboard → frontend-web 서비스 → Variables에서 다음을 설정해야 합니다:

### 필수 환경 변수

```
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
```

**중요**: 
- 빌드 타임에 필수입니다
- 값이 없으면 빌드가 실패합니다
- `NEXT_PUBLIC_` prefix를 반드시 유지해야 합니다

### 선택 환경 변수

```
NEXT_PUBLIC_LOCALE=ko
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## 로컬 개발 환경

로컬에서는 `next.config.js`의 기본값이 사용됩니다:
- `NEXT_PUBLIC_API_URL`: 기본값 제공 (개발용)
- Railway에서는 반드시 설정해야 합니다

## 환경 변수 사용 방법

### ✅ 올바른 방법

```typescript
import { API_BASE_URL } from '@/lib/env'

// API_BASE_URL 사용
const response = await fetch(`${API_BASE_URL}/api/v1/endpoint`)
```

### ❌ 잘못된 방법

```typescript
// 직접 process.env 사용 금지
const url = process.env.NEXT_PUBLIC_API_URL  // ❌
```

## 빌드 타임 검증

`src/lib/env.ts`에서 빌드 타임에 환경 변수를 검증합니다:
- `NEXT_PUBLIC_API_URL`이 없으면 빌드가 즉시 실패합니다
- 명확한 에러 메시지를 제공합니다

## 문제 해결

### 빌드 실패: "NEXT_PUBLIC_API_URL is not defined"

1. Railway Dashboard → Variables 확인
2. `NEXT_PUBLIC_API_URL` 값이 설정되어 있는지 확인
3. 빈 문자열이 아닌지 확인
4. 재배포

### TypeScript 오류처럼 보이는 경우

실제로는 환경 변수 누락일 수 있습니다:
1. Railway Variables 확인
2. `NEXT_PUBLIC_API_URL` 설정 확인
3. 빌드 로그에서 실제 오류 메시지 확인
