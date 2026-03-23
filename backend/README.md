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

### 관리 API 403 (역할은 맞는데 API만 거절될 때)

JWT의 `role` 클레임은 **로그인 시점** DB 값으로 발급됩니다. DB에서 `users.role`을 `SUPER_ADMIN`으로 바꾼 뒤에는 **반드시 다시 로그인**해야 새 토큰에 반영됩니다.

확인/수정 예시 (PostgreSQL):

```sql
SELECT id, email, role FROM users WHERE email = 'your@email.com';
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

이후 프론트에서 로그아웃 → 다시 로그인 → `/admin/super` 재접속.

## 크레딧 결제(목 PG) — Flyway V18 + V19

- V18: `payment_orders` 테이블 + `credit_packages.sort_order`, `created_at` 추가.
- V19: 주문 상태 문자열 `PENDING` → `CREATED` (Java enum과 DB 정합). 상태: **CREATED → READY → PAID | FAILED | CANCELLED**.
- 유저: `POST /api/credits/prepare-payment` → `GET /api/credits/orders/{orderNo}` → (목) `POST /api/payments/callback/success|fail` (로그인 사용자·본인 주문만).
- 패키지 충전 크레딧은 `credit_transactions.type=CHARGE`, `reason=PACKAGE_PURCHASE`, `reference_id=order_no` 로만 적립; 동일 조합이 이미 있으면 재지급하지 않음.
- 실 PG 연동 시 `PaymentProvider` 구현체 추가 및 콜백을 서버 간 검증으로 바꾸면 된다.
