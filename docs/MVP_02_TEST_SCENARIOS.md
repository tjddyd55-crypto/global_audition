# MVP_02_creator_channel: 테스트 시나리오

## 1. 채널 공개 페이지 데이터 조회 (PUBLIC)
**시나리오**: 비로그인 사용자가 PUBLIC 채널 조회
- **요청**: `GET /api/v1/channels/{userId}` (Authorization 헤더 없음)
- **예상 결과**: 
  - 200 OK
  - userName, stageName, bio, bannerUrl, youtubeUrl, instagramId, featuredVideoId, channelVisibility 포함
  - 실제 데이터 표시

## 2. PRIVATE 채널 조회 (소유자)
**시나리오**: APPLICANT가 자신의 PRIVATE 채널 조회
- **요청**: `GET /api/v1/channels/{userId}` (Authorization: Bearer {소유자 토큰})
- **예상 결과**: 
  - 200 OK
  - 채널 정보 반환

## 3. PRIVATE 채널 조회 (ADMIN)
**시나리오**: ADMIN이 PRIVATE 채널 조회
- **요청**: `GET /api/v1/channels/{userId}` (Authorization: Bearer {ADMIN 토큰})
- **예상 결과**: 
  - 200 OK
  - 채널 정보 반환

## 4. PRIVATE 채널 조회 (권한 없음)
**시나리오**: 다른 사용자가 PRIVATE 채널 조회 시도
- **요청**: `GET /api/v1/channels/{userId}` (Authorization: Bearer {다른 사용자 토큰})
- **예상 결과**: 
  - 403 FORBIDDEN
  - "비공개 채널입니다" 메시지

## 5. 채널 프로필 수정 (소유자)
**시나리오**: APPLICANT가 자신의 채널 정보 수정
- **요청**: `PUT /api/v1/channels/me` (Authorization: Bearer {소유자 토큰})
- **Body**: `{ "stageName": "새 닉네임", "bio": "새 소개", "featuredVideoId": 123 }`
- **예상 결과**: 
  - 200 OK
  - 수정된 채널 정보 반환

## 6. 채널 프로필 수정 (권한 없음)
**시나리오**: AGENCY가 APPLICANT 채널 수정 시도
- **요청**: `PUT /api/v1/channels/me` (Authorization: Bearer {AGENCY 토큰})
- **예상 결과**: 
  - 403 FORBIDDEN
  - "지원자만 채널 정보를 수정할 수 있습니다" 메시지

## 7. 대표영상 설정
**시나리오**: APPLICANT가 대표영상 설정
- **요청**: `PUT /api/v1/channels/me` (Authorization: Bearer {소유자 토큰})
- **Body**: `{ "featuredVideoId": 123 }`
- **예상 결과**: 
  - 200 OK
  - featuredVideoId가 123으로 설정됨

## 8. 채널 공개 범위 변경
**시나리오**: APPLICANT가 채널을 PRIVATE로 변경
- **요청**: `PUT /api/v1/channels/me` (Authorization: Bearer {소유자 토큰})
- **Body**: `{ "channelVisibility": "PRIVATE" }`
- **예상 결과**: 
  - 200 OK
  - channelVisibility가 PRIVATE로 변경됨
  - 이후 비로그인 사용자 조회 시 403 FORBIDDEN
