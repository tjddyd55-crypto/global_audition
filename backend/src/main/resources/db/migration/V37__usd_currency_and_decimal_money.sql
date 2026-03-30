-- 플랫폼 결제 통화: KRW(정수 원) → USD(소수 불가 금액은 NUMERIC).
-- 기존 행은 대략적 환산(1 USD ≈ 1300 KRW) — 운영 반영 전 실제 환율/데이터로 점검 권장.

ALTER TABLE credit_packages
  ALTER COLUMN price TYPE NUMERIC(14, 2)
  USING (ROUND((price::numeric / 1300.0), 2));

ALTER TABLE payment_orders
  ALTER COLUMN amount TYPE NUMERIC(14, 2)
  USING (ROUND((amount::numeric / 1300.0), 2));

UPDATE payment_orders SET currency = 'USD' WHERE UPPER(TRIM(currency)) = 'KRW';

ALTER TABLE payment_orders
  ALTER COLUMN currency SET DEFAULT 'USD';
