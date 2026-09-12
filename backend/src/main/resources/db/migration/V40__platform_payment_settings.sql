SET search_path TO public;

-- 결제 플랫폼 설정 1행. 시크릿은 암호문만 저장. 평문 시크릿 컬럼 없음.
CREATE TABLE IF NOT EXISTS public.platform_payment_settings (
    id SMALLINT NOT NULL PRIMARY KEY DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT false,
    environment TEXT NOT NULL DEFAULT 'TEST',
    currency TEXT NOT NULL DEFAULT 'KRW',
    test_client_key TEXT,
    live_client_key TEXT,
    test_secret_cipher TEXT,
    live_secret_cipher TEXT,
    foreign_card_krw BOOLEAN NOT NULL DEFAULT false,
    foreign_currency_enabled BOOLEAN NOT NULL DEFAULT false,
    variant_key TEXT,
    mid TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT platform_payment_settings_singleton CHECK (id = 1),
    CONSTRAINT platform_payment_settings_env_chk CHECK (environment IN ('TEST', 'LIVE'))
);

INSERT INTO public.platform_payment_settings (id, enabled, environment, currency, foreign_currency_enabled)
VALUES (1, false, 'TEST', 'KRW', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payment_orders
    ADD COLUMN IF NOT EXISTS payment_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_orders_payment_key
    ON public.payment_orders (payment_key)
    WHERE payment_key IS NOT NULL;
