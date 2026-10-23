-- 정산 통화 SSOT: USD.
-- Toss confirm/checkout amount 는 공식 문서상 정수 major-unit (달러). Stripe 센트 아님.
-- 패키지/주문 금액은 재환산하지 않는다 (V37이 이미 USD NUMERIC). 환율 발명 금지.

ALTER TABLE public.platform_payment_settings
    ALTER COLUMN currency SET DEFAULT 'USD';

UPDATE public.platform_payment_settings
SET currency = 'USD',
    foreign_currency_enabled = false,
    updated_at = NOW()
WHERE id = 1;

ALTER TABLE public.platform_payment_settings
    DROP CONSTRAINT IF EXISTS platform_payment_settings_currency_usd;

ALTER TABLE public.platform_payment_settings
    ADD CONSTRAINT platform_payment_settings_currency_usd
        CHECK (upper(trim(currency)) = 'USD');

COMMENT ON COLUMN public.platform_payment_settings.currency IS
    'Platform settlement currency. Always USD. Toss amount.value is integer dollars.';
