# i18n/번역 시스템(SSOT)

## 1) 범위 분리
- **UI i18n**: `frontend/web/messages/{locale}.json` 이 Web(next-intl)과 Native(i18next)의 **단일 카탈로그 SSOT**.
- 1급 로케일: `ko` / `en` / `mn`. 기존 `ja/zh/es/fr/de` 는 유지하며 새 키는 en fallback.
- Native 는 같은 JSON 을 Metro로 로드하고 `expo-secure-store` 키 `app.locale` 에 저장한다. 기기 언어가 지원 목록에 없으면 `en`.
- **도메인 콘텐츠 번역**: 오디션 공고는 `auditions.default_locale` 원문 + `audition_translations` 오버레이. 요청 `?locale=` 또는 `X-Content-Locale`. 없으면 원문.

## 2) 도메인 콘텐츠 번역 전략(권장)
- 저장 모델: `originalLocale + originalText + translations[{locale, text, status, provider, updatedAt}]`
- 번역 트리거:
  - 생성/수정 시 “번역 필요” 상태로 기록
  - 비동기 작업(큐/스케줄러)로 번역 수행 후 `translations` 채움
- 조회 모델:
  - 요청 locale의 번역이 있으면 사용
  - 없으면 원문 fallback

## 2-1) 현재 구현
- `auditions.default_locale` + `audition_translations` (V42). 상태 `PENDING / COMPLETED / FAILED`, provider 기본 `MANUAL`.
- 공개 조회: `GET /api/auditions?locale=` / `X-Content-Locale`. COMPLETED 번역이 있으면 오버레이, 없으면 원문 + `contentLocaleFallback=true`.
- 쓰기: `GET/PUT /api/auditions/{id}/translations/{locale}` (owner / ADMIN).
- 자동 번역 Provider·큐·`translation_jobs` 는 아직 없다.
- 라운드 공고 문구(`audition_rounds`) 번역 테이블은 아직 없다.

## 3) Provider 추상화(벤더 교체 대비)
- `TranslationProvider`(interface) + 구현체(Ali/기타)
- 캐시/레이트리밋/에러 재시도 정책은 application 계층에서 통제

## 4) 운영/품질
- 번역 실패/지연은 UX에 치명적이므로, 항상 fallback을 보장
- 감사 가능하도록 provider/버전/입력/출력 메타데이터 저장(개인정보는 마스킹)

## 5) 아직 미완
- 슈퍼 어드민 콘솔은 ko 유지(의도).
- 일부 기획사 관리 심층 화면·라운드 제출 폼에 하드코딩 한국어가 남을 수 있다.
- 라운드 공고 번역 테이블, 자동 번역 Provider 없음.
- 법률 문서 기계번역 없음.

## 6) 기획사 번역 UI
- 오디션 생성/수정 폼에 원문 언어(`defaultLocale`)와 대상 국가(`countryCode`: KR/MN/GLOBAL)를 표시한다.
- 원문 저장 후 ko/en/mn 탭에서 제목·소개·자격·일정·혜택 등을 저장한다.
- 로케일별 Complete / Missing 은 `COMPLETED` + 비어 있지 않은 title 기준.
- 권한: owner / ADMIN / SUPER_ADMIN. 다른 기획사는 403.

