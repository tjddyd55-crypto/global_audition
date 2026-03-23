# S3 이미지 업로드 (오디션 에디터)

## 흐름

```
프론트 파일 선택
  → uploadAuditionImage(file, dir) — 반드시 apiClient (JWT)
  → POST /api/uploads/image?dir=... (multipart, 필드명 file)
  → Spring Boot → S3 PutObject
  → { "url": "https://..." } 반환
  → 폼 state(coverImage / galleryImages / agencyLogo)에 URL 저장
  → 오디션 저장 시 DB에는 URL 문자열만 저장
```

## S3 객체 키 (`dir` 쿼리)

| `dir` 값 | 키 접두사 |
|----------|-----------|
| `covers` (기본) | `auditions/covers/` |
| `gallery` | `auditions/gallery/` |
| `agency_logo` | `agencies/logos/` |

잘못된 `dir` → 400.

## 빌드 도구

이 저장소는 **Maven**을 사용합니다. Gradle 예시와 동등한 의존성:

```xml
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>s3</artifactId>
  <version>2.20.0</version>
</dependency>
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `AWS_BUCKET` | **필수** (운영/Railway). 비우면 S3 빈 미등록 → 업로드 API 503. 예: `global-audition` |
| `AWS_REGION` | **필수**. 예: `ap-northeast-2` |
| `AWS_ACCESS_KEY` / `AWS_SECRET_KEY` | 액세스 키 (레거시 이름) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS 표준 이름 (동일 우선순위: 레거시가 있으면 레거시 사용) |
| `AWS_S3_PUBLIC_BASE_URL` | 선택. CloudFront 등 공개 URL 접두사 |
| `AWS_S3_ENDPOINT` | 선택. MinIO 등 S3 호환 엔드포인트 |

**퍼블릭 읽기**: 버킷 정책(또는 CloudFront)으로 `s3:GetObject` 허용.**PutObject에 Object ACL 미설정** — *Bucket owner enforced* 환경 호환.

## CORS (Spring)

- `WebConfig`: `/api/**`에 **PATCH** 포함, `allowCredentials(true)`.
- `allowCredentials(true)`일 때 `Access-Control-Allow-Methods: *` 는 피하고 메서드 나열.

## 프론트 SSOT

- **허용**: `uploadAuditionImage` (`src/lib/api/uploads.ts`) 만 사용.
- **금지**: `fetch` 직접 호출, Authorization 없는 업로드 → **401** 및 운영 이슈.

## 오류 대응

| 증상 | 조치 |
|------|------|
| **401** | JWT 없음 → `apiClient` + 로그인 확인 |
| **403** | AGENCY/ADMIN 아님 또는 IAM에 `s3:PutObject` 없음 |
| 업로드 성공인데 이미지 안 보임 | 버킷 정책·CloudFront·URL 접두사(`public-base-url`) 확인 |

## Postman

1. `POST {{baseUrl}}/api/uploads/image?dir=covers` (또는 `gallery`, `agency_logo`)
2. Body → form-data → key `file` (File)
3. `Authorization: Bearer <토큰>`
4. 응답: `{ "url": "https://.../auditions/covers/uuid.jpg" }`

## 비즈니스 규칙 (오디션)

- **DRAFT**: 대표 이미지 선택.
- **OPEN / CLOSED**: 대표 이미지 **필수** (프론트 검증 + `AuditionService` 서버 검증).

## 업로드 제한

- **크기**: 파일당 최대 **5MB**
- **형식**: **JPEG, PNG, WebP** (`image/jpeg`, `image/png`, `image/webp`)

## 테스트 체크리스트

1. [ ] 이미지 업로드 → S3 콘솔에서 해당 접두사 경로에 객체 생성
2. [ ] 반환 URL 브라우저로 열어 이미지 표시
3. [ ] 오디션 등록(OPEN) → DB `cover_image` 등 URL 저장
4. [ ] 상세 페이지에서 이미지 출력
5. [ ] 임시저장(DRAFT) → 수정 → 재업로드·저장 정상

## 레거시 객체 경로

과거 배포: `audition-images/` 또는 `auditions/{uuid}` 단일 폴더. 현재는 위 표의 하위 폴더 구조를 사용합니다.
