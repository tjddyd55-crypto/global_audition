# Media-Service 스키마 안정화 후 Flyway 복원 가이드

## 현재 상태 (크래시 루프 해소용)

- **ddl-auto 단일 진실 소스(SSOT)**: `application.yml` 에만 정의. profile(production, local 등)에서는 제거됨.
- **ddl-auto 값**: `none` → Hibernate는 스키마 생성/검증 안 함. 스키마는 Flyway로 적용.
- **Flyway**: 활성화됨. 기동 시 `db/migration` V1~V6 실행 (video_contents, creative_assets, video_feedback, video_comments, comment_likes).
- **연결 대상**: Railway **내부 DB** (`SPRING_DATASOURCE_URL` → 예: `postgres.railway.internal:5432/railway`)

### Railway Variables — 환경변수 오염 차단

- **SPRING_JPA_HIBERNATE_DDL_AUTO** 환경변수 **사용 금지**. 설정하면 yml을 덮어써 `validate` 등으로 바뀌어 크래시 가능.
- ddl-auto는 `application.yml` 단일 소스만 사용. Railway Variables에 해당 키 추가하지 말 것.

### 기동 시 적용 값 확인

- 로그에 `🔥 Hibernate ddl-auto in EFFECT = none` 출력됨 (HibernateConfigLogger). 크래시 시 이 한 줄로 설정 원인 판별 가능.

## 재배포 후 확인

1. Railway에서 media-service 재배포
2. 로그에서 확인:
   - `🔥 Hibernate ddl-auto in EFFECT = none`
   - Flyway 마이그레이션 성공 (V1~V6)
   - `Schema-validation: missing table` **없음**
   - 애플리케이션 기동 후 계속 실행 중

## 현재: Flyway ON, ddl-auto=none (크래시 루프 해소)

- **원칙**: Hibernate 스키마 관리 비활성화(ddl-auto=none). Flyway가 기동 시 V1~V6로 스키마 생성/보완. 서버 안정 기동 후 필요 시 ddl-auto=validate 복원 가능.

## 안정화 후 (30분 이상 안정 확인된 뒤): Flyway로 전환하고 validate 복원

1. **Flyway 의존성 추가** (media-service/pom.xml)
   - `spring-boot-starter-jdbc` 또는 Flyway 의존성 추가
2. **마이그레이션 파일**  
   - V1~V6 존재: V1 video_contents, V2 creative_assets, V3 video_type/visibility, V4 video_feedback, V5 video_comments, V6 comment_likes. (V2 content_hash 인덱스 반영됨)
3. **Flyway 활성화** 후 기동 1회 (내부 DB에 마이그레이션 적용)
4. **ddl-auto=validate** 로 변경 (`application.yml` SSOT에서만 변경)
5. 이후 스키마 변경은 Flyway 마이그레이션으로만 수행 (서비스 외부에서 수동 DDL 하지 않기)
