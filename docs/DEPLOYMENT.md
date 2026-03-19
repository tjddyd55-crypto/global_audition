# Audition 플랫폼 배포 순서 (운영 필수)

## 1. 원칙

`auditions` 테이블은 **Flyway 마이그레이션 → 백엔드(JPA) → 프론트** 순으로 맞춰야 합니다.  
DB 스키마가 애플리케이션 엔티티보다 뒤처지거나 앞서면 런타임/기동 시 매핑 오류가 납니다.

## 2. 권장 순서

1. **DB**: Flyway 실행 (최소 V6까지 적용) — `detail_content` 없음, `qualifications`·`schedules`·기타 `text[]` 확정
2. **Backend**: Spring Boot 기동
3. **Frontend**: Next.js 빌드/배포

## 3. SSOT (5-way)

다음이 동일 필드·타입을 유지해야 합니다.

| 단계 | 위치 |
|------|------|
| DB | `backend/src/main/resources/db/migration/` |
| JPA | `Audition.java` |
| API | `AuditionResponse`, `CreateAuditionRequest`, `UpdateAuditionRequest` |
| Prisma | `prisma/schema.prisma` |
| Types | `frontend/web/src/lib/types/audition.ts` |

배열 필드: `recruitFields`, `qualifications`, `schedules`, `benefits`, `galleryImages` — **JSON/`detail_content` 재도입 금지**.

## 4. API 응답

서비스 레이어에서 엔티티 배열 필드를 빈 배열로 정규화한 뒤 응답합니다. 프론트는 `parseAuditionDto` + `safeStringArr`로 이중 방어합니다.
