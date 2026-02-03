# MVP_03_video_upload: 테스트 시나리오 검증

## 테스트 시나리오 통과 확인

### 1. APPLICANT 영상 업로드 성공 ✅
- **엔드포인트**: `POST /api/v1/videos`
- **구현**: `VideoContentService.createVideo()` - 이미 구현됨
- **검증**: userId와 CreateVideoRequest로 영상 생성

### 2. 비로그인 업로드 시도 → 401 ✅
- **엔드포인트**: `POST /api/v1/videos` (Authorization 헤더 없음)
- **구현**: `SecurityUtils.getUserIdFromAuthHeaderOrThrow()` - ResponseStatusException(401) 반환
- **검증**: 인증 헤더 없을 시 401 UNAUTHORIZED 반환

### 3. 타 사용자 영상 수정 시도 → 403 ✅
- **엔드포인트**: `PUT /api/v1/videos/{id}`
- **구현**: `VideoContentService.updateVideo()` - 소유자 확인 후 403 반환
- **검증**: `!video.getUserId().equals(userId)` 시 ResponseStatusException(403) 반환

### 4. PRIVATE 영상 타 사용자 조회 → 403 ✅
- **엔드포인트**: `GET /api/v1/videos/{id}`
- **구현**: `VideoContentService.getVideo(id, requesterId)` - visibility 검증
- **검증**: PRIVATE 영상이고 requesterId가 소유자가 아니면 403 반환

### 5. PUBLIC 영상 누구나 조회 가능 ✅
- **엔드포인트**: `GET /api/v1/videos/{id}`
- **구현**: `VideoContentService.getVideo(id, requesterId)` - PUBLIC은 조회 가능
- **검증**: visibility가 PUBLIC이면 requesterId 없이도 조회 가능

### 6. 영상 삭제 후 조회 시 404 ✅
- **엔드포인트**: `GET /api/v1/videos/{id}` (삭제된 영상)
- **구현**: `VideoContentService.getVideo()` - DELETED 상태 체크
- **검증**: `video.getStatus() == DELETED` 시 404 반환

### 7. 오디션 지원 시 영상 연결 성공 ✅
- **엔드포인트**: `POST /api/v1/applications`
- **구현**: `ApplicationService.createApplication()` - videoId1, videoId2 사용
- **검증**: CreateApplicationRequest에 videoId1, videoId2 포함하여 지원서 생성

### 8. FINALIZED 오디션에 영상 변경 시도 → 409
- **상태**: Application 수정 API가 현재 없음 (MVP_01 구조 유지)
- **향후 확장**: Application 수정 API 추가 시 FINALIZED 상태 체크 필요
- **현재**: 오디션 지원 시 FINALIZED 상태면 지원 자체가 불가능 (MVP_01에서 구현됨)

## 추가 구현 사항

1. **VideoContentService.getVideo()** - requesterId 파라미터 추가, visibility 및 DELETED 상태 검증
2. **VideoContentService.updateVideo()** - ResponseStatusException(403) 반환
3. **VideoContentService.deleteVideo()** - ResponseStatusException(403) 반환
4. **SecurityUtils.getUserIdFromAuthHeaderOrThrow()** - ResponseStatusException(401) 반환
5. **VideoContentController.getVideo()** - Authorization 헤더에서 requesterId 추출
