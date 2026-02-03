# 프론트엔드 규칙 (SSOT)

이 문서는 프론트엔드 개발 규칙을 정의한다.

## 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: 
  - React Query: 서버 데이터
  - Zustand: UI 상태

## 데이터 Fetching
- **React Query** 사용
- 서버 상태는 React Query로 관리
- 캐싱, 리프레시, 에러 처리 자동화

## 상태 관리
- **서버 데이터**: React Query
- **UI 상태**: Zustand
- **폼 상태**: React Hook Form

## 라우팅
- Next.js App Router 사용
- 다국어 지원: `[locale]` 동적 세그먼트
- 모바일 전용 라우트: `(mobile)` 그룹

## 컴포넌트 구조
- 페이지: `app/[locale]/**/page.tsx`
- 컴포넌트: `components/**/*.tsx`
- 타입: `types/index.ts`
- API 클라이언트: `lib/api/**/*.ts`

## 스타일링 규칙
- Tailwind CSS 유틸리티 클래스 사용
- 커스텀 스타일은 `styles/` 디렉토리
- 반응형 디자인: 모바일 우선

## 다국어 지원
- `next-intl` 사용
- 번역 파일: `messages/{locale}.json`
- 서버 컴포넌트에서 `getTranslations` 사용

## API 클라이언트
- `lib/api/` 디렉토리에 서비스별 클라이언트
- Axios 사용
- 에러 처리 통일

## 타입 안정성
- 모든 API 응답 타입 정의
- `types/index.ts`에 중앙 관리
- 타입스크립트 strict 모드 유지
