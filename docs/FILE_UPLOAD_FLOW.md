# 파일 업로드 플로우 문서화 (Phase A)

## 개요

Frontend ↔ Media-Service 간 파일 업로드 플로우를 코드 레벨에서 검증하고 문서화합니다.
**실제 파일 업로드는 아직 실행하지 않습니다.**

## 업로드 플로우 3단계

### [1단계] Frontend: 파일 선택 및 Validation

**위치**: `frontend/web/src/app/[locale]/vault/page.tsx` (CreateAssetModal)

**현재 구현**:
- `<input type="file">` 사용
- 파일 선택 시 `setFile()` 호출
- 기본적인 파일 선택만 수행

**TODO: Validation 추가 필요**:
- ❌ 파일 크기 제한 검증 (50MB)
- ❌ 파일 확장자 제한 검증
- ❌ MIME 타입 체크

**참고**: Media-Service의 제한사항과 일치시켜야 함

---

### [2단계] Frontend → Media-Service: Upload 요청

**위치**: `frontend/web/src/lib/api/vault.ts` (createAsset)

**구현**:
- `FormData` 사용
- `multipart/form-data` Content-Type
- `apiClient.post('/vault/assets', formData)`
- Gateway를 통해 media-service로 라우팅

**엔드포인트**:
- `POST /api/v1/vault/assets`
- Gateway URL: `{API_BASE_URL}/api/v1/vault/assets`

**인증**:
- `Authorization` 헤더 필요
- `apiClient`가 자동으로 토큰 추가

**요청 파라미터**:
- `file` (optional): MultipartFile
- `textContent` (optional): String
- `title` (required): String
- `description` (optional): String
- `assetType` (required): String
- `declaredCreationType` (optional): String
- `accessControl` (required): String

---

### [3단계] Media-Service: Storage 처리

**위치**: `backend/services/media-service`

#### 업로드 엔드포인트

**컨트롤러**: `CreativeAssetController.createAsset()`
- 경로: `POST /api/v1/vault/assets`
- Gateway를 통해 접근: `{GATEWAY_URL}/api/v1/vault/assets`

#### Storage Provider

**현재 구현**: Local File System
- 서비스: `FileStorageService`
- 이미지 저장 경로: `./uploads/images/{userId}/{uuid}.{ext}`
- 비디오/오디오 저장 경로: `./uploads/videos/{userId}/{uuid}.{ext}`
- Base URL: `application.yml`의 `file.upload.base-url` 설정값 사용

**향후 계획**:
- S3 또는 CDN으로 마이그레이션 예정
- 인터페이스 추상화를 통해 교체 가능하도록 설계 필요

#### 인증

**필수**: `Authorization` 헤더 필요
- `SecurityUtils.getUserIdFromAuthHeaderOrThrow()`로 검증
- 인증 실패 시 `401 Unauthorized` 반환

#### 파일 크기 제한

**설정 위치**: `application.yml`
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
```

**초과 시**: `413 Payload Too Large` 반환

#### 파일 확장자 검증

**위치**: `FileStorageService.isValidImageExtension()`, `isValidVideoExtension()`

**허용 확장자**:
- **이미지**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **비디오/오디오**: `.mp4`, `.mov`, `.avi`, `.webm`, `.mp3`, `.wav`, `.flac`, `.aac`, `.mid`, `.midi`, `.m4a`, `.ogg`

**미지원 확장자 시**: `IllegalArgumentException` 발생 (400 Bad Request)

---

## 추가 업로드 엔드포인트

### MediaController (이미지 전용)

**엔드포인트**:
- 단일 이미지: `POST /api/v1/media/upload/image`
- 다중 이미지: `POST /api/v1/media/upload/images` (최대 10개)

**Storage**: `FileStorageService` 사용 (로컬 파일 시스템)
**인증**: 필수 (Authorization 헤더)
**제한사항**: CreativeAssetController와 동일

---

## Frontend Validation TODO

다음 검증을 추가해야 합니다:

### 1. 파일 크기 제한
```typescript
// TODO: vault/page.tsx의 CreateAssetModal에 추가
if (selectedFile.size > 50 * 1024 * 1024) {
  alert('파일 크기는 50MB를 초과할 수 없습니다')
  return
}
```

### 2. 파일 확장자 검증
```typescript
// TODO: vault/page.tsx의 CreateAssetModal에 추가
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.webm', '.mp3', '.wav', '.flac', '.aac', '.mid', '.midi', '.m4a', '.ogg']
const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
if (!allowedExtensions.includes(fileExtension)) {
  alert('지원하지 않는 파일 형식입니다')
  return
}
```

### 3. MIME 타입 체크
```typescript
// TODO: vault/page.tsx의 CreateAssetModal에 추가
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', ...]
if (!allowedMimeTypes.includes(selectedFile.type)) {
  alert('지원하지 않는 파일 형식입니다')
  return
}
```

---

## 관련 파일

### Frontend
- `frontend/web/src/lib/api/vault.ts` - API 클라이언트
- `frontend/web/src/app/[locale]/vault/page.tsx` - 파일 선택 UI

### Backend
- `backend/services/media-service/src/main/java/.../controller/CreativeAssetController.java` - 업로드 엔드포인트
- `backend/services/media-service/src/main/java/.../controller/MediaController.java` - 이미지 업로드 엔드포인트
- `backend/services/media-service/src/main/java/.../storage/FileStorageService.java` - Storage Provider
- `backend/services/media-service/src/main/resources/application.yml` - 파일 크기 제한 설정

---

## 다음 단계 (Phase B)

- Frontend Validation 구현
- 실제 파일 업로드 테스트
- 에러 처리 강화
- 업로드 진행률 표시
- 파일 미리보기 기능
