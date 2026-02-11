# frontend-web Railway 설정 (SSOT)

## 중요 원칙

**frontend-web의 Build/Start 설정은 Railway UI가 아니라 `frontend/web/railway.json`이 SSOT입니다.**

- ❗ Railway UI에서 Build/Start 설정을 수정하지 않습니다
- ✅ 반드시 `frontend/web/railway.json`만 수정합니다
- ✅ railway.json이 변경되면 Railway가 자동으로 반영합니다

## 현재 설정 (SSOT)

**파일**: `frontend/web/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 설정 설명

### Build 설정
- **builder**: `NIXPACKS` (Railway의 기본 빌더)
- **buildCommand**: `npm install && npm run build`
  - 의존성 설치 후 Next.js 빌드 실행

### Deploy 설정
- **startCommand**: `npm start`
  - package.json의 `start` 스크립트 실행 (`next start`)
- **restartPolicyType**: `ON_FAILURE`
  - 실패 시 자동 재시작
- **restartPolicyMaxRetries**: `10`
  - 최대 재시작 횟수

## package.json 스크립트

**파일**: `frontend/web/package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest"
  }
}
```

- `npm run build`: Next.js 프로덕션 빌드
- `npm start`: Next.js 프로덕션 서버 시작

## 환경 변수

Railway Dashboard에서 설정 (railway.json이 아님):
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_BASE_URL=https://<api-backend-domain>`

## 변경 시 주의사항

1. **railway.json만 수정**: Railway UI에서 Build/Start 설정을 변경하지 않습니다
2. **Root Directory**: `frontend/web` (Railway 서비스 설정에서 확인)
3. **package.json 스크립트**: railway.json의 명령어가 package.json의 스크립트와 일치해야 합니다

## 서버 기준선 준수

- ✅ Root Directory: `frontend/web`
- ✅ Build Command: `npm install && npm run build` (railway.json)
- ✅ Start Command: `npm start` (railway.json)
- ✅ API 호출: `api-backend`만 허용 (gateway/audition-service URL 사용 금지)
