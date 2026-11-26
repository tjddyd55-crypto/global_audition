# Backend (Single Spring Boot)

단일 Spring Boot 애플리케이션. Flyway로 DB 스키마 관리, Hibernate ddl-auto=none (production).

## 빌드 및 실행

```bash
./mvnw -DskipTests package
java -jar target/*.jar
```

로컬에서 실행 시 Postgres URL은 `src/main/resources/application.yml` 또는 환경 변수(`SPRING_DATASOURCE_*`)로 설정.

Railway 배포: Root = `backend`, `docs/RAILWAY_RESET_RUNBOOK.md` 참고.

## Railway Development 슈퍼 관리자

Railway의 Development 백엔드 Variables에서 아래 두 값을 설정하고 재배포합니다.

- `BOOTSTRAP_SUPER_ADMIN_EMAIL` — 로그인에 사용하는 이메일
- `BOOTSTRAP_SUPER_ADMIN_PASSWORD` — 6자 이상, UTF-8 기준 최대 72바이트의 비밀번호

설정한 이메일과 일치하는 활성 계정이 있으면 그 계정을 슈퍼 관리자로 지정합니다. 일치하는 계정이 없으면 이미 Railway로 관리 중인 계정의 이메일을 바꾸거나, 처음 설정하는 경우 새 계정을 생성합니다.
그 외의 기존 슈퍼 관리자 계정은 일반 지원자 권한으로 바뀌며 계정과 데이터는 보존됩니다.
지정한 계정의 로그인 정보 또는 권한이 변경되면 기존 세션과 복구 코드가 무효화됩니다. 설정이 비어 있거나 유효하지 않으면 계정과 역할을 그대로 유지합니다.

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
