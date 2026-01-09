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
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## 주요 기능

- ✅ 모바일 우선 반응형 디자인
- ✅ 오디션 목록 및 상세 페이지
- ✅ API 연동 (React Query)
- ✅ 타입 안전성 (TypeScript)
