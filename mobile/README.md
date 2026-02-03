# Global Audition Platform - Mobile App

React Native / Expo 기반 모바일 앱

## 기술 스택

- Expo ~50.0.0
- React Native 0.73.0
- TypeScript
- React Query (@tanstack/react-query)
- Expo Router

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# iOS 시뮬레이터 실행
npm run ios

# Android 에뮬레이터 실행
npm run android
```

## 구조

- `app/`: Expo Router 기반 화면
  - `index.tsx`: 로그인 화면
  - `auditions.tsx`: 오디션 목록 화면
- `src/lib/api/`: API 클라이언트
  - `client.ts`: Axios 기반 API 클라이언트
  - `auth.ts`: 인증 API
  - `auditions.ts`: 오디션 API

## 환경 변수

`.env` 파일에 다음 변수를 설정하세요:

```
EXPO_PUBLIC_API_URL=http://localhost:8080
```
