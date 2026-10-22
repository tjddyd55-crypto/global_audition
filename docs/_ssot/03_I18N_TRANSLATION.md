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
- 오디션 공고는 `auditions.default_locale`(V44 이후 VARCHAR(16))와 `audition_translations` 를 유지한다. `audition_translations.locale` 는 VARCHAR(8) 그대로다. 이 열은 언어 서브태그(ko, en, mn, zh)만 담는다. 행을 옮기거나 지우지 않는다.
- 공개 오디션 조회는 `?locale=` 또는 `X-Content-Locale` 의 COMPLETED 번역을 덮어쓴다. 없으면 원문과 `contentLocaleFallback=true`.
- 오디션 자동 번역 작업 `POST /api/auditions/{id}/translation-jobs` 는 동기 호출로 남긴다. 공통 큐로 옮기지 않는다.
- 그 외 본문은 V47 `content_translations` / `content_translation_attempts` / `content_translation_jobs` 다. locale 열은 VARCHAR(35) 이며 pt-BR, zh-Hant 를 그대로 둔다.
- 읽기 `GET /api/content-translations/{type}/{id}` 는 공급자를 호출하지 않는다. 저장된 번역이 없으면 원문과 `showingOriginal` 을 반환하고, 없을 때만 작업을 넣는다.
- 큐는 `FOR UPDATE SKIP LOCKED` 와 임대 시각으로 재기동 뒤 RUNNING 행을 다시 집는다. 키가 없으면 작업은 `BLOCKED` / `NOT_CONFIGURED` 로 끝나고 토큰은 null 이다.
- 원문 언어 열은 기본값 없이 비어 있다. 저장된 locale 을 영어나 한국어로 되돌리지 않는다.
- 라운드 공지 문구는 `PATCH /api/admin/auditions/{id}/rounds/{roundId}/notices` 만 바꾼다. 라운드 활성, 일정, 심사 방식, 오디션 상태는 이 경로에서 바꾸지 않는다.

## 3) Provider 추상화(벤더 교체 대비)
- `TranslationProvider` 뒤에 `SelectingTranslationProvider` 가 활성 공급자를 고른다.
- 기본 활성 공급자는 Google Cloud Translation Advanced v3 (`GOOGLE_CLOUD_TRANSLATION`) 이다. OpenAI 호환 공급자(`OPENAI_COMPATIBLE`)는 보조로 남고, 기존 endpoint/model/api_key_cipher 는 지우지 않는다.
- Google 호출은 `projects/{project}/locations/{location}:translateText`, mimeType `text/plain`, 모델 기본값 `general/nmt` 이다. 인증은 서비스 계정 JSON 으로 만든 OAuth2 액세스 토큰이며 API 키가 아니다. JSON 은 `SettingsSecretCrypto` 암호문으로만 저장하고 응답과 로그에 넣지 않는다.
- 허용 호스트 기본값은 `api.openai.com`, `translate.googleapis.com`, `oauth2.googleapis.com` 이다.
- 문자 비용은 설정 단가로 추정한다. 공개 NMT 리스트 가격은 https://cloud.google.com/translate/pricing 이고, 월 500,000자 크레딧은 추정액에서 빼지 않는다. 추정액은 청구서가 아니다.
- 캐시/레이트리밋/에러 재시도 정책은 application 계층에서 통제한다. 공급자 자격 증명이 없으면 작업은 `BLOCKED` / `NOT_CONFIGURED` 이고 원문을 보여 준다.

## 4) 운영/품질
- 번역 실패/지연은 UX에 치명적이므로, 항상 fallback을 보장
- 감사 가능하도록 provider/버전/입력/출력 메타데이터 저장(개인정보는 마스킹)

## 5) 아직 미완
- 슈퍼 어드민 콘솔은 ko 유지(의도).
- 일부 기획사 관리 심층 화면·라운드 제출 폼에 하드코딩 한국어가 남을 수 있다.
- 오디션 공고의 동기 번역과 공통 큐는 분리되어 있다. 음성, 자막, 썸네일은 번역하지 않는다.
- 법률 문서 기계번역 없음.

## 6) 기획사 번역 UI
- 오디션 생성/수정 폼에 원문 언어(`defaultLocale`)와 대상 국가(`countryCode`: KR/MN/GLOBAL)를 표시한다.
- 원문 저장 후 ko/en/mn 탭에서 제목·소개·자격·일정·혜택 등을 저장한다.
- 로케일별 Complete / Missing 은 `COMPLETED` + 비어 있지 않은 title 기준.
- 권한: owner / ADMIN / SUPER_ADMIN. 다른 기획사는 403.

