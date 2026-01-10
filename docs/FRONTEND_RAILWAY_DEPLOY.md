# Frontend (Next.js) Railway 배포 가이드

## 사전 준비

✅ Gateway Service - 배포 완료 (`https://gateway-production-72d6.up.railway.app`)

## Frontend 배포 단계

### 1. Railway에서 서비스 생성

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택 (다른 서비스들이 있는 프로젝트)

2. **"+ Create" 버튼 클릭**

3. **"GitHub Repo" 선택**

4. **GitHub 저장소 선택 및 연결**
   - 저장소 선택
   - 필요시 권한 부여

5. **서비스 설정**
   - Service Name: `frontend-web` (또는 원하는 이름)
   - Root Directory: `frontend/web` ⚠️ **중요!**
   - Branch: `main` (또는 기본 브랜치)

### 2. 빌드 설정

**Settings → Build & Deploy** 섹션에서:

- **Build Command:**
  ```
  npm install && npm run build
  ```

- **Start Command:**
  ```
  npm start
  ```

- **Watch Paths:** (선택 사항)
  ```
  frontend/web/**
  ```

### 3. 환경 변수 설정

**Settings → Variables** 섹션에서 다음 환경 변수를 추가:

#### 필수 환경 변수

```bash
# API Gateway URL (프로덕션)
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app

# Node 환경
NODE_ENV=production

# Next.js 포트 (Railway가 자동 설정하지만 명시적으로 설정)
PORT=3000
```

#### 환경 변수 설명

1. **NEXT_PUBLIC_API_URL**
   - 값: `https://gateway-production-72d6.up.railway.app`
   - 프론트엔드에서 백엔드 API를 호출하는 URL
   - **주의:** Gateway URL이 변경되면 이 값도 업데이트 필요

2. **NODE_ENV**
   - 값: `production`
   - Next.js 프로덕션 모드 활성화

3. **PORT**
   - 값: Railway가 자동으로 할당 (보통 3000)
   - Next.js가 리스닝할 포트

### 4. Railway 자동 설정

- `PORT` - Railway가 자동으로 할당
- `RAILWAY_ENVIRONMENT` - Railway가 자동 설정

### 5. 배포 방법

#### 방법 1: GitHub 자동 배포 (권장)

1. Railway에서 서비스 생성 후
2. GitHub 저장소 연결
3. Root Directory를 `frontend/web`로 설정
4. 환경 변수 설정
5. 자동으로 배포 시작

#### 방법 2: Railway CLI 사용

```bash
cd frontend/web
railway login
railway link  # 프로젝트 연결 (첫 배포 시)
railway up    # 배포
```

### 6. 배포 확인

#### Health Check

배포가 완료되면 (보통 3-5분 소요) 다음 URL로 확인:

```
https://[frontend-service-url]
```

**예상 동작:**
- Next.js 홈페이지가 표시되어야 함
- 브라우저 콘솔에서 API 호출이 정상 작동해야 함

#### API 연결 확인

1. 브라우저 개발자 도구(F12) 열기
2. Network 탭 확인
3. 페이지 로드 시 `/api/v1/...` 요청이 `https://gateway-production-72d6.up.railway.app`로 전송되는지 확인

### 7. Public URL 확인

배포 완료 후:

1. Railway 대시보드에서 `frontend-web` 서비스 선택
2. **Settings → Networking** 탭으로 이동
3. **Generate Domain** 버튼 클릭 (자동 생성된 도메인 사용)
4. 또는 **Custom Domain** 설정 (도메인이 있는 경우)

**Public URL 예시:**
```
https://frontend-web-production-xxxx.up.railway.app
```

### 8. 문제 해결

#### 빌드 실패

**문제:** `npm install` 또는 `npm run build` 실패

**해결:**
- Railway 로그 확인 (Deployments → 최신 배포 → Logs)
- `package.json`의 의존성 확인
- Node.js 버전 확인 (Railway는 자동으로 최신 LTS 버전 사용)

#### API 연결 실패 (CORS 에러)

**문제:** 브라우저에서 CORS 에러 발생

**해결:**
- Gateway의 `application-production.yml`에서 CORS 설정 확인
- `allowedOrigins`에 프론트엔드 URL 추가 필요할 수 있음

#### 환경 변수 미적용

**문제:** `NEXT_PUBLIC_API_URL`이 적용되지 않음

**해결:**
- Railway에서 환경 변수 재설정 후 재배포
- Next.js는 빌드 시 `NEXT_PUBLIC_*` 변수를 포함하므로 환경 변수 변경 후 재빌드 필요
- **Settings → Variables**에서 변수 확인 후 **Redeploy** 버튼 클릭

### 9. 재배포

환경 변수나 코드 변경 후:

1. GitHub에 푸시하면 자동 재배포
2. 또는 Railway 대시보드에서 **Deployments → Redeploy** 클릭

### 10. 최종 확인 사항

- [ ] 프론트엔드 서비스가 정상적으로 배포됨
- [ ] Public URL로 접속 가능
- [ ] API 연결 정상 (Network 탭 확인)
- [ ] 로그인/회원가입 기능 테스트
- [ ] 오디션 목록 조회 테스트
- [ ] 기획사 오디션 관리 페이지 접속 테스트
- [ ] 지원자 채널 관리 페이지 접속 테스트

## 🎉 완료 후

배포가 완료되면:

1. **프론트엔드 Public URL 메모:**
   ```
   https://[frontend-service-url]
   ```

2. **최종 서비스 링크 정리:**
   - **프론트엔드 (메인 사이트):** `https://[frontend-service-url]`
   - **API Gateway:** `https://gateway-production-72d6.up.railway.app`
   - **User Service:** `https://user-service-production-7ba1.up.railway.app`
   - **Audition Service:** `https://audition-service-production.up.railway.app`
   - **Media Service:** `https://media-service-production-dff0.up.railway.app`

3. **사용자 접속 주소:**
   - 실제 이용자가 접속할 주소는 **프론트엔드 Public URL**입니다.
