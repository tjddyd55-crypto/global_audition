# Gateway 경유 구조 정합성 검증 (Phase A)

## 개요

Frontend → Gateway → Media-Service 경로가 구조적으로 가능한 상태인지 확인합니다.
**실제 라우팅 변경은 하지 않습니다.**

## Gateway 라우팅 현황

### 현재 설정된 라우팅

**위치**: `backend/services/gateway/src/main/resources/application.yml`

```yaml
# Media Service
- id: media-service
  uri: http://localhost:8083
  predicates:
    - Path=/api/v1/videos/**
  filters:
    - StripPrefix=0
```

**설정된 경로**:
- ✅ `/api/v1/videos/**` → media-service로 라우팅됨

### Gateway 미설정 경로

다음 경로들은 Gateway에 라우팅 설정이 없습니다:

- ❌ `/api/v1/vault/**` - CreativeAssetController
- ❌ `/api/v1/media/**` - MediaController (이미지 업로드)
- ❌ `/api/v1/videos/{videoId}/comments/**` - VideoCommentController
- ❌ `/api/v1/search/videos/**` - VideoSearchController
- ❌ `/api/v1/videos/ranking/**` - VideoRankingController
- ❌ `/api/v1/videos/feedback/**` - VideoFeedbackController
- ❌ `/api/v1/analytics/creator/**` - CreatorAnalyticsController

## Frontend 호출 방식

### 현재 상태

**직접 호출 vs Gateway 경유**:

| 엔드포인트 | Gateway 라우팅 | Frontend 호출 방식 | 상태 |
|-----------|---------------|-------------------|------|
| `/api/v1/videos/**` | ✅ 설정됨 | Gateway 경유 가능 | ✅ |
| `/api/v1/vault/**` | ❌ 미설정 | 직접 호출 (현재) | ⚠️ |
| `/api/v1/media/**` | ❌ 미설정 | 직접 호출 (현재) | ⚠️ |

**참고**: 
- 현재는 직접 호출 허용
- 향후 Gateway에 라우팅 추가 후 상수만 수정하여 전환 가능

## Endpoint 상수화

### 생성된 파일

**위치**: `frontend/web/src/lib/api/endpoints.ts`

**내용**:
- `MEDIA_ENDPOINTS`: 모든 media-service 엔드포인트 상수화
- `USE_GATEWAY`: Gateway 경유 가능 여부 플래그

### 사용 예시

```typescript
import { MEDIA_ENDPOINTS } from '@/lib/api/endpoints'

// Videos API (Gateway 경유 가능)
const videos = await apiClient.get(MEDIA_ENDPOINTS.VIDEOS)

// Vault API (Gateway 경유 불가, 직접 호출)
const assets = await apiClient.get(`${MEDIA_ENDPOINTS.VAULT}/assets/my`)
```

### 적용된 파일

- ✅ `frontend/web/src/lib/api/videos.ts` - MEDIA_ENDPOINTS.VIDEOS 사용
- ✅ `frontend/web/src/lib/api/vault.ts` - MEDIA_ENDPOINTS.VAULT 사용
- ✅ `frontend/web/src/lib/api/health.ts` - MEDIA_ENDPOINTS.VIDEOS 사용

## Gateway 전환 가능 구조

### 현재 구조

```
Frontend
  ↓
API_BASE_URL (Gateway URL)
  ↓
apiClient (baseURL: /api/v1)
  ↓
MEDIA_ENDPOINTS (상대 경로)
  ↓
실제 호출: {API_BASE_URL}/api/v1{MEDIA_ENDPOINTS.XXX}
```

### 전환 방법

1. **Gateway에 라우팅 추가**:
   ```yaml
   - id: media-service-vault
     uri: http://media-service:8083
     predicates:
       - Path=/api/v1/vault/**
     filters:
       - StripPrefix=0
   ```

2. **Frontend 상수 수정** (선택):
   - `USE_GATEWAY.VAULT = true`로 변경
   - 실제 코드 변경 불필요 (이미 상수화됨)

## 향후 작업 (Phase B)

- Gateway에 `/api/v1/vault/**` 라우팅 추가
- Gateway에 `/api/v1/media/**` 라우팅 추가
- Gateway에 기타 media-service 경로 라우팅 추가
- Frontend에서 직접 호출 → Gateway 경유로 전환

## 관련 파일

### Gateway
- `backend/services/gateway/src/main/resources/application.yml`
- `backend/services/gateway/src/main/resources/application-production.yml`
- `backend/services/gateway/src/main/java/.../GatewayController.java`

### Frontend
- `frontend/web/src/lib/api/endpoints.ts` (신규)
- `frontend/web/src/lib/api/videos.ts`
- `frontend/web/src/lib/api/vault.ts`
- `frontend/web/src/lib/api/health.ts`
