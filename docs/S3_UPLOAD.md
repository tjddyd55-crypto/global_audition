# 오디션 이미지 업로드 (R2, 백엔드 경유)

## 고정 구조 (변경하지 않음)

```
브라우저 → 백엔드 API → R2 (S3Client, PutObject)
```

| 허용 | 금지 (현 단계) |
|------|----------------|
| `POST /api/uploads/image` (multipart, JWT) | 프론트에서 R2 URL로 직접 PUT/POST |
| 서버가 key 생성 후 `putObject` | presigned URL로 브라우저→스토리지 직접 업로드 |
| 표시: 반환 공개 URL을 `img src` 등으로 사용 | 프론트에서 객체 key 조합·생성 |

**영상/음원(향후)** 은 별도 정책으로 S3 direct upload(presigned 등) 가능. **이미지는 계속 백엔드→R2**만 사용해 S3 direct 경로와 충돌하지 않는다.

## 흐름 (에디터)

```
파일 선택
  → uploadAuditionImage(file, dir) — SSOT (apiFetch + JWT)
  → POST /api/uploads/image?dir=...
  → Spring → R2 PutObject
  → { "url": "https://<r2-public-domain>/audition/..." }
  → 폼 state에 URL 저장 → 오디션 저장 시 DB에는 URL 문자열만
```

## R2 버킷 CORS

현재 구조에서는 **R2 CORS 설정이 필요하지 않다.** 브라우저가 R2에 쓰기(업로드) 요청을 보내지 않기 때문이다.

- 업로드: 브라우저 → 백엔드만 (백엔드 CORS는 기존 `WebConfig` / `APP_CORS_ALLOWED_ORIGINS` 유지).
- 이미지 표시: 공개 URL에 대한 GET은 일반적으로 `<img src>`·직접 링크에 CORS 제약이 없다.

다른 프로젝트/버킷에 이미 CORS가 있어도 그대로 두면 되고, **오디션 전용으로 R2 CORS를 새로 맞출 필요는 없다.**  
(나중에 브라우저→R2 직접 업로드나 presigned PUT을 도입하면 그때 버킷 CORS 검토.)

## 객체 키 (`dir` 쿼리, 서버에서만 접두사 조합)

| `dir` 값 | 키 접두사 (예) |
|----------|----------------|
| `covers` (기본) | `audition/auditions/covers/` |
| `gallery` | `audition/auditions/gallery/` |
| `agency_logo` | `audition/agencies/logos/` |

파일명은 서버에서 UUID 등으로 붙인다. 잘못된 `dir` → 400.

## 환경 변수 (이미지 / R2)

| 변수 | 설명 |
|------|------|
| `R2_ENDPOINT` | 예: `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` / `R2_SECRET_KEY` | R2 API 토큰 |
| `R2_BUCKET` | 버킷 이름 |
| `R2_PUBLIC_URL` | 공개 읽기 URL 접두사 (예: `https://pub-xxx.r2.dev` 또는 CDN) |
| `AWS_REGION` | R2 서명용, 예: `auto` |

향후 **영상·파일 전용 AWS S3** 는 `APP_S3_CLIENT_ENABLED=true` 및 `AWS_*` 로 별도 `awsS3Client` — 이미지 `r2S3Client` 와 분리.

## Spring / 빌드

- **`SPRING_PROFILES_ACTIVE` 를 두지 마세요.** `application.yml` + 환경변수만 사용.
- 빌드: **Maven**. AWS SDK S3 의존성으로 R2 호환 API 사용.

## CORS (Spring 앱)

- `WebConfig`: API용 — `allowCredentials` 등 기존 유지.
- 이는 **백엔드**에 대한 브라우저 요청용이며, R2 버킷 CORS와 별개다.

## 프론트 SSOT

- **허용**: `uploadAuditionImage` (`src/lib/api/uploads.ts`) 만 사용.
- **금지**: 스토리지 직접 호출, 무인증 업로드.

## 헬스 (`GET /api/uploads/health`)

인증 불필요. 예: `bucket`, `publicUrl`, `storage=r2`, `status`(`OK` | `UNAVAILABLE`).

## 오류 대응

| 증상 | 조치 |
|------|------|
| **401** | JWT 없음 → `apiFetch` + 로그인 |
| **403** | 역할·백엔드 권한 또는 R2 자격증명 확인 |
| **500** | 로그·R2 설정·버킷 정책 |
| 업로드 OK인데 이미지 안 보임 | `R2_PUBLIC_URL`, 버킷 퍼블릭/커스텀 도메인·정책 |

## 업로드 제한

- **크기**: 파일당 최대 **5MB**
- **형식**: **JPEG, PNG, WebP**

## 레거시

과거 배포: S3 단일 경로 또는 `audition-images/` 등. 현재 이미지는 R2 + 위 `audition/...` 접두사.
