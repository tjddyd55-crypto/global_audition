# 도메인 모델/경계(SSOT)

## 1) Bounded Context(서비스 경계) - 현재 구조를 기준선으로
- **user-service**: 사용자/인증/역할/프로필(지원자/기획사/운영자)
- **audition-service**: 오디션 공고/지원/심사 단계/선발 프로세스
- **media-service**: 영상/이미지(유튜브 링크/메타데이터/검증), 채널 콘텐츠
- **gateway**: 라우팅/인증 관문/공통 정책(CORS, rate limit 등)

## 2) 핵심 엔티티(초안)
- User, ApplicantProfile, BusinessProfile(=Agency profile)
- Audition, AuditionStage(가변), Application, ReviewDecision
- Channel, VideoContent(유튜브 기반), Playlist/Series(향후)
- Column, FeedbackSession(Phase 3 기본 구현)
- TranslationJob, StripeWebhookEvent(Phase 4 기본 구현)
- AgencyBookmark(Phase 5 기본 구현)
- AuditLog(Phase 6 기본 구현)
- SystemNotification(Phase 7 기본 구현)

## 3) “가변 심사 단계” 설계 원칙
- 1차~3차는 하드코딩하지 않고 `AuditionStage` 정의를 데이터로 둔다.
- Application은 “현재 stage”를 참조하며, stage 이동은 명시적인 유스케이스로만 수행한다.

## 4) “분야 확장(가수/댄서→모델/연기)” 설계 원칙
- 오디션 분야는 `TalentCategory`(또는 taxonomy)로 분리하여 확장한다.
- UI/검색/필터는 taxonomy 데이터 기반으로 구성한다.

## 5) 유튜브 운영 원칙
- 저장은 “파일 업로드”가 아니라 **YouTube URL/VideoId + 검증 + 메타데이터 캐싱** 중심.
- 삭제/비공개 등 외부 상태 변화에 대비해 “동기화/검증 작업”을 배치로 둔다.

