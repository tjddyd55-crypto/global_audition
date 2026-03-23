# 크레딧·결제·관리자 403 점검 체크리스트

운영/개발 시 **403**, 인증 불일치, PG 연동 전 설계를 맞추기 위한 SSOT 문서입니다.

## 1. 공통 fetch / HTTP 클라이언트

| 규칙 | 설명 |
|------|------|
| **금지** | 페이지·훅에서 `fetch('/api/...')` 상대 경로만 쓰고 백엔드 URL·쿠키·토큰을 제각각 넣기 |
| **권장** | `apiFetch` / `apiFetchJson` / **`apiFetchPublic`** (또는 동일 정책의 `apiClient`) |
| **Bearer** | `options.auth !== false` 이고 토큰이 있을 때만 `Authorization` 설정(기본은 인증 헤더 시도). |
| **공개 API** | `apiFetchPublic(...)` 또는 `apiFetch(..., { auth: false })` — **로그인 필수 API에 쓰면 401/403**(서버가 막음). 클라이언트가 권한을 “뚫는” 것이 아님. |
| **기타** | `credentials: 'include'`, FormData 시 `Content-Type` 미설정 |

새 API 호출을 추가할 때는 반드시 위 레이어를 거칩니다.

## 2. SUPER_ADMIN과 403

UI에서 “슈퍼 관리자”로 보여도 **API가 403**이면 다음을 의심합니다.

1. **DB `users.role` (또는 동등 컬럼)** 가 실제로 `SUPER_ADMIN` 인지  
2. **JWT는 로그인 시점 스냅샷** — DB를 올린 뒤 **재로그인** 없이 옛 토큰을 쓰고 있지 않은지  
3. 메인 로그인(`[locale]/login`) 성공 후 **`window.location.assign(/{locale}/...)`** 으로 전체 로드 → 메모리 내 옛 JWT/스토어와 불일치로 인한 403 완화  
4. 백엔드 `@PreAuthorize` / Security 설정이 기대 역할 문자열과 일치하는지  

예시 확인 (환경에 맞게 테이블명 조정):

```sql
SELECT id, email, role FROM users WHERE email = 'your-admin@example.com';
```

## 3. 주문(`payment_orders`) vs 지급(`credit_transactions` + `user_credits`)

| 단계 | 저장소 | 책임 |
|------|--------|------|
| 주문 생성 | `payment_orders` | 상태 흐름: **CREATED** → **READY** → **PAID** \| **FAILED** \| **CANCELLED** |
| 결제 확정 콜백 | 동일 주문 row 상태 전이 | “돈이 들어왔다”는 사실만 반영 |
| 크레딧 반영 | `credit_transactions` + `user_credits` | `CreditService.applyChargeFromPaymentOrder` 등 **별 트랜잭션/단계** |

**한 HTTP 요청에서** “주문 INSERT + 잔액 증가”를 묶지 않습니다. PG 붙일 때 웹훅·재시도·멱등성이 꼬이지 않도록 유지합니다.

성공 콜백: **`SELECT ... FOR UPDATE`**(JPA `PESSIMISTIC_WRITE`) + **`status == PAID` 이면 즉시 return** → 중복 크레딧 지급 방지.

## 4. 프론트 산출물 맵 (크레딧 플로우)

| 화면 | 경로(예) |
|------|-----------|
| 크레딧 메인 | `/credits` |
| 패키지 선택 | `/credits/charge` |
| 결제 직전(주문 확인) | `/credits/checkout` |
| Mock 성공/실패 테스트 | `/credits/mock-pay` |
| 결과 성공/실패 | `/credits/result/success`, `/credits/result/fail` |
| 관리자 패키지 | 관리자 크레딧 패키지 CRUD 화면 |
| 관리자 거래 | `GET /api/admin/transactions` 등 연동 화면 |
| 관리자 로그 | `admin_logs` 연동 화면 |

**`/my/wallet`** 은 **`/credits`로 리다이렉트**만 수행(이중 잔액·UX 제거). SSOT는 `/credits`.

## 5. 백엔드 구조 요약

- `POST .../prepare-payment` → `payment_orders` 생성  
- `POST .../callback/success|fail` → 주문 상태 + (성공 시) 크레딧 적용  
- `GET .../orders/{orderNo}` → 주문 조회  

자세한 마이그레이션·엔드포인트는 `backend` README 및 Flyway **V18**(`payment_orders` 생성), **V19**(`PENDING`→`CREATED` 마이그레이션)를 참고합니다.
