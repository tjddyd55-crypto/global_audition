# Frontend Railway 배포 가이드

## 사전 준비

✅ Gateway Service - 배포 완료 (`https://gateway-production-72d6.up.railway.app`)

## Frontend 배포 단계

### 1. Railway에서 서비스 생성

1. Railway 대시보드 접속
2. 프로젝트 선택 (다른 서비스들이 있는 프로젝트)
3. "+ New" → "GitHub Repo" 선택
4. Repository 선택
5. **Root Directory를 `frontend/web`으로 설정** (중요!)

### 2. 환경 변수 설정 (필수!)

Railway 대시보드에서 `frontend-web` → "Variables" 탭에서 다음 변수를 설정:

#### 필수 환경 변수

```bash
# API Gateway URL (백엔드로의 요청 경로)
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
```

**⚠️ 중요:**
- `NEXT_PUBLIC_` 접두사가 필수입니다 (Next.js에서 클라이언트 사이드 환경 변수는 이 접두사가 필요)
- 빌드 타임에 환경 변수가 하드코딩되므로, 환경 변수를 설정한 후 **재빌드**가 필요합니다
- Gateway URL은 반드시 HTTPS로 시작해야 합니다

#### 선택적 환경 변수

```bash
# 로케일 설정 (기본값: ko)
NEXT_PUBLIC_LOCALE=ko
```

### 3. 배포 설정 확인

Railway 대시보드에서:

1. **Settings** → **Root Directory**: `frontend/web`
2. **Settings** → **Build Command**: `npm install && npm run build` (자동 감지)
3. **Settings** → **Start Command**: `npm start` (자동 감지)

### 4. 배포 확인

#### 브라우저 콘솔 확인

1. 프론트엔드 사이트 접속
2. 브라우저 개발자 도구 (F12) → Console 탭 열기
3. 다음 로그 확인:

**정상일 경우:**
```
[API Client] ✅ API Base URL: https://gateway-production-72d6.up.railway.app/api/v1
```

**문제가 있을 경우:**
```
[API Client] ⚠️ NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.
[API Client] Railway → frontend-web → Variables에서 NEXT_PUBLIC_API_URL을 설정해주세요.
[API Client] 기본값 사용: https://gateway-production-72d6.up.railway.app
```

#### Network 탭 확인

1. 브라우저 개발자 도구 → Network 탭
2. 회원가입 버튼 클릭
3. `register` 요청 확인:

**정상일 경우:**
- **Request URL**: `https://gateway-production-72d6.up.railway.app/api/v1/auth/register`
- **Status**: 200, 201, 또는 400 (서버 응답)

**문제가 있을 경우:**
- **Request URL**: `https://frontend-web-production-xxxx.up.railway.app/api/v1/auth/register` (자기 자신)
- **Status**: 404 또는 500

### 5. 문제 해결

#### 문제 1: 요청이 자기 자신(frontend-web)으로 가는 경우

**증상:**
- Network 탭에서 Request URL이 `https://frontend-web-production-xxxx.up.railway.app/api/v1/...`로 표시됨
- 404 또는 500 에러 발생

**원인:**
- `NEXT_PUBLIC_API_URL` 환경 변수가 설정되지 않음
- 환경 변수를 설정했지만 재빌드하지 않음

**해결:**
1. Railway → frontend-web → Variables 확인
2. `NEXT_PUBLIC_API_URL` 환경 변수 설정:
   ```
   NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
   ```
3. Railway → frontend-web → Settings → "Redeploy" 클릭 (재빌드)

#### 문제 2: CORS 에러 발생

**증상:**
- 브라우저 콘솔에 `CORS policy` 에러
- Network 탭에서 요청이 `(blocked:cors)`로 표시됨

**원인:**
- Gateway의 CORS 설정 문제

**해결:**
1. Gateway 서비스의 `application-production.yml`에서 CORS 설정 확인
2. Gateway Variables에서 `allowedOrigins` 확인:
   ```
   allowedOrigins: "*"  # 또는 프론트엔드 URL
   ```

#### 문제 3: 500 Internal Server Error

**증상:**
- Network 탭에서 Status가 500
- 브라우저 콘솔에 상세 에러 메시지 없음

**원인:**
- 백엔드 서버 문제 (Gateway 또는 User Service)

**해결:**
1. Gateway HTTP Logs 확인:
   - Railway → gateway → Deployments → 최신 배포 → HTTP Logs
   - POST 요청이 있는지 확인
2. User Service Logs 확인:
   - Railway → user-service → Deployments → 최신 배포 → Logs
   - 에러 메시지 확인

## 환경 변수 체크리스트

배포 전 반드시 확인:

- [ ] `NEXT_PUBLIC_API_URL`이 설정되어 있는가?
- [ ] Gateway URL이 정확한가? (HTTPS, 끝에 슬래시 없음)
- [ ] 환경 변수 설정 후 재빌드했는가?
- [ ] 브라우저 콘솔에서 API Base URL이 올바르게 표시되는가?
- [ ] Network 탭에서 요청이 Gateway로 가는가?

## 배포 후 확인 사항

1. ✅ 프론트엔드 사이트 접속 가능
2. ✅ 브라우저 콘솔에서 API Base URL 확인
3. ✅ 회원가입 시도 후 Network 탭 확인
4. ✅ Gateway HTTP Logs에 요청이 도달하는지 확인
5. ✅ User Service Logs에 요청이 처리되는지 확인

## 참고 사항

### Next.js 환경 변수 특징

- `NEXT_PUBLIC_` 접두사가 붙은 환경 변수만 클라이언트 사이드에서 접근 가능
- 환경 변수는 **빌드 타임**에 하드코딩됨
- 환경 변수를 변경한 후에는 **반드시 재빌드**해야 함

### Railway 환경 변수 설정 방법

1. Railway 대시보드 → 프로젝트 선택
2. `frontend-web` 서비스 선택
3. "Variables" 탭 클릭
4. "+ New Variable" 클릭
5. Name: `NEXT_PUBLIC_API_URL`, Value: `https://gateway-production-72d6.up.railway.app`
6. "Add" 클릭
7. "Redeploy" 클릭 (재빌드)
