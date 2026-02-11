# i18n/번역 시스템(SSOT)

## 1) 범위 분리
- **UI i18n**: 프론트 `messages/*.json`처럼 “키 기반 번역”으로 관리
- **도메인 콘텐츠 번역**: 오디션 공고/프로필/칼럼 등 “사용자 생성 콘텐츠”는 별도 전략 필요

## 2) 도메인 콘텐츠 번역 전략(권장)
- 저장 모델: `originalLocale + originalText + translations[{locale, text, status, provider, updatedAt}]`
- 번역 트리거:
  - 생성/수정 시 “번역 필요” 상태로 기록
  - 비동기 작업(큐/스케줄러)로 번역 수행 후 `translations` 채움
- 조회 모델:
  - 요청 locale의 번역이 있으면 사용
  - 없으면 원문 fallback

## 2-1) 현재 구현(Phase 4 최소)
- `translation_jobs` 테이블로 **번역 작업 생성/조회**를 기록한다.
- 상태: `PENDING / COMPLETED / FAILED`
- 번역 작업 API는 `ADMIN` 권한으로 제한한다(내부 호출 전제).
- 실제 Provider 연동과 비동기 처리(큐/스케줄러)는 다음 단계에서 추가한다.

## 3) Provider 추상화(벤더 교체 대비)
- `TranslationProvider`(interface) + 구현체(Ali/기타)
- 캐시/레이트리밋/에러 재시도 정책은 application 계층에서 통제

## 4) 운영/품질
- 번역 실패/지연은 UX에 치명적이므로, 항상 fallback을 보장
- 감사 가능하도록 provider/버전/입력/출력 메타데이터 저장(개인정보는 마스킹)

