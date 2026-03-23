# Backend (Single Spring Boot)

단일 Spring Boot 애플리케이션. Flyway로 DB 스키마 관리, Hibernate ddl-auto=none (production).

## 빌드 및 실행

```bash
./mvnw -DskipTests package
java -jar target/*.jar
```

로컬에서 실행 시 Postgres URL은 `src/main/resources/application.yml` 또는 환경 변수(`SPRING_DATASOURCE_*`)로 설정.

Railway 배포: Root = `backend`, `docs/RAILWAY_RESET_RUNBOOK.md` 참고.

## 초기 슈퍼관리자 계정 (Flyway V17)

마이그레이션 적용 후 다음 계정이 **없을 때만** 생성됩니다.

| 항목 | 값 |
|------|-----|
| 이메일 | `superadmin@audition.local` |
| 비밀번호 | `SuperAdmin!ChangeMe` |
| 역할 | `SUPER_ADMIN` |

**프로덕션**에서는 로그인 후 비밀번호 변경 또는 해당 시드 계정을 비활성화·삭제하고, 안전한 절차로 관리자를 만드세요.

### 로그인 401 (계정이 DB에 없을 때)

Flyway V17이 아직 적용되지 않았거나 INSERT가 스킵된 경우(이메일 중복 등) 로그인에 실패할 수 있습니다. 아래 중 하나를 사용하세요.

1. **배포에 최신 백엔드( V17 포함 ) 포함 여부** 확인 후 DB에 `flyway_schema_history`에 `17`이 있는지 확인합니다.
2. **기동 부트스트랩** (Railway 환경 변수):
   - `BOOTSTRAP_SUPER_ADMIN=true` → 재배포/재기동 → 계정이 없으면 생성됩니다.
   - 로그인 확인 후 **`BOOTSTRAP_SUPER_ADMIN=false` 로 되돌리거나 변수 삭제** (보안).
   - 선택: `BOOTSTRAP_SUPER_ADMIN_EMAIL`, `BOOTSTRAP_SUPER_ADMIN_PASSWORD` 로 이메일·비밀번호 변경 가능.
   - 이미 계정이 있는데 비밀번호만 맞추려면: `BOOTSTRAP_SUPER_ADMIN=true` 와 함께 `BOOTSTRAP_SUPER_ADMIN_RESET_PASSWORD=true` (한 번만 사용 후 둘 다 끌 것).
