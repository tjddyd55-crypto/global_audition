# Audition Platform - Frontend

Next.js 14 기반 웹 애플리케이션

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (데이터 페칭)
- **Zustand** (상태 관리)
- **React Hook Form** (폼 관리)

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

로컬 브라우저 주소는 `http://localhost:<포트>` 하나만 쓴다. 로그인 세션은 `Domain` 없는 HttpOnly 쿠키 `accessToken`(`SameSite=Lax`, HTTP에서는 `Secure` 없음)과 `localStorage`에 같이 남는다. 둘 다 호스트 전용이라 `127.0.0.1`과 쿠키를 공유하지 않는다. `next dev`는 요청 URL을 `localhost`로 두고, 미들웨어가 `Location`을 `127.0.0.1`로 바꿔도 Next가 다시 `localhost`로 되돌린다. `127.0.0.1`로 열면 기획사 화면 리다이렉트에서 세션이 끊긴다.

### 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router
│   ├── (mobile)/     # 모바일 우선 라우트
│   ├── layout.tsx    # 루트 레이아웃
│   └── page.tsx      # 홈 페이지
├── components/       # 재사용 컴포넌트
├── lib/              # 유틸리티 및 API 클라이언트
├── hooks/            # Custom Hooks
└── types/            # TypeScript 타입 정의
```

## 환경 변수

`.env.local` 파일 생성:

```env
# Railway Gateway URL (프로덕션)
NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app

# 로컬 개발 시
# NEXT_PUBLIC_API_URL=http://localhost:8080
```

**참고:** Railway Gateway URL은 실제 배포된 Gateway 서비스 URL로 변경해야 합니다. Railway 대시보드에서 확인할 수 있습니다.

## 주요 기능

- ✅ 모바일 우선 반응형 디자인
- ✅ 오디션 목록 및 상세 페이지
- ✅ API 연동 (React Query)
- ✅ 타입 안전성 (TypeScript)
