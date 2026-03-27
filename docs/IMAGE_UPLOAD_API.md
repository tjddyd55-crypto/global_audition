# 이미지 업로드 API (`POST /api/uploads/image`)

인증: `AGENCY` 또는 `ADMIN` 역할(JWT Bearer).

## 요청

- **Content-Type**: `multipart/form-data`
- **필드**
  - `file`: 이미지 파일 (JPEG / PNG / WebP)
  - `dir`(선택): `audition` | `profile` | `thumbnail` (미지정 시 `audition`)

업로드 한도는 백엔드 `app.upload.max-image-bytes` 및 `spring.servlet.multipart`와 동일하게 맞출 것(기본 10MB).

## 성공 응답 (200)

`Content-Type: application/json`

프론트·백엔드 공통 계약:

```json
{
  "url": "원본 공개 URL (풀 해상도)",
  "urls": {
    "original": "원본과 동일",
    "medium": "최대 변 길이 800px 부근(비율 유지)",
    "thumb": "최대 변 길이 300px 부근(비율 유지)"
  }
}
```

- DB·폼 상태에는 일반적으로 **`url`(원본)** 만 저장해도 된다.
- 카드·리스트 등에서는 **`urls.thumb`** 또는 프론트 `src/lib/audition/storageImageUrls.ts`의 `storageImageThumbUrl()`으로 원본 URL에서 썸네일 URL을 유도해 대역폭을 줄일 수 있다.
- 파생 생성·업로드에 실패한 경우에도 HTTP 200과 함께 `medium`·`thumb`가 **원본과 같은 문자열**로 채워질 수 있다(유저 경험 유지). 운영에서는 로그 토큰 `image_upload_variant_failed` 로 구분한다.

## 오류 응답

본문은 항상 JSON:

```json
{ "message": "설명" }
```

| 상태 | 예시 |
|------|------|
| 400 | 형식·dir·빈 파일 |
| 401 / 403 | 인증·역할(업로드는 AGENCY/ADMIN) |
| 413 | 용량 초과 |
| 429 | 사용자별 업로드 횟수 한도 |
| 500 / 503 | 서버·R2 설정 등 |

## R2 객체 키 규칙 (참고)

- 원본: `{dirPrefix}{uuid}{tail}` 예: `audition/a1b2..._photo.jpg`
- medium: `{dirPrefix}m/{uuid}{tail}` (파생 포맷에 맞는 확장자, PNG 원본은 PNG 파생)
- thumb: `{dirPrefix}t/{uuid}{tail}`

모든 객체에 `Cache-Control: public, max-age=31536000, immutable` 적용.

## 운영 체크리스트

1. **JPEG/PNG**: 파생 3종이 실제 R2에서 열리는지 샘플 업로드로 확인.
2. **WebP**: twelvemonkeys 등 ImageIO SPI에 따라 환경마다 파생 실패 가능 — 실패 시 `image_upload_variant_failed` 로그 확인.
3. **EXIF**: 파생은 `useExifOrientation(true)` 로 회전 반영. iPhone 실사진으로 썸네일 방향 확인 권장.
