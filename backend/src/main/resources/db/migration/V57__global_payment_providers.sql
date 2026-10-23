-- Multi-PG catalog. Existing payment_orders, credit_transactions, and settlements are not rewritten or deleted.

ALTER TABLE public.payment_orders
    ADD COLUMN IF NOT EXISTS environment VARCHAR(8),
    ADD COLUMN IF NOT EXISTS payment_country CHAR(2),
    ADD COLUMN IF NOT EXISTS charge_currency CHAR(3),
    ADD COLUMN IF NOT EXISTS charge_amount_minor BIGINT,
    ADD COLUMN IF NOT EXISTS fx_rate_id UUID,
    ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS credits_issued BIGINT,
    ADD COLUMN IF NOT EXISTS refunded_minor BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refunded_credits BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider_config_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS method_code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(80);

ALTER TABLE public.payment_orders
    DROP CONSTRAINT IF EXISTS payment_orders_environment_chk;
ALTER TABLE public.payment_orders
    ADD CONSTRAINT payment_orders_environment_chk
    CHECK (environment IS NULL OR environment IN ('MOCK', 'TEST', 'LIVE'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_user_idempotency
    ON public.payment_orders (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.credit_lots
    ADD COLUMN IF NOT EXISTS ledger_environment VARCHAR(8);

COMMENT ON COLUMN public.payment_orders.environment IS
    'MOCK and TEST are excluded from operational cash lots and LIVE payouts. NULL keeps historical rows in the operational lot rebuild.';
COMMENT ON COLUMN public.credit_lots.ledger_environment IS
    'Copied from payment_orders.environment when lots are rebuilt. MOCK and TEST allocations are omitted from LIVE payable sums.';

CREATE TABLE public.payment_provider_configs (
    id VARCHAR(64) PRIMARY KEY,
    adapter_code VARCHAR(32) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    environment VARCHAR(8) NOT NULL,
    countries TEXT NOT NULL DEFAULT '',
    currencies TEXT NOT NULL DEFAULT '',
    methods TEXT NOT NULL DEFAULT '',
    contract_status VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    implemented BOOLEAN NOT NULL DEFAULT FALSE,
    connection_status VARCHAR(32) NOT NULL DEFAULT 'NOT_CHECKED',
    last_connection_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT payment_provider_env_chk CHECK (environment IN ('MOCK', 'TEST', 'LIVE')),
    CONSTRAINT payment_provider_status_chk CHECK (contract_status IN (
        'NOT_CONFIGURED', 'TEST_READY', 'TEST_FAILED', 'APPROVAL_PENDING', 'LIVE_READY', 'DISABLED'))
);

CREATE TABLE public.payment_provider_secrets (
    id UUID PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL REFERENCES public.payment_provider_configs (id),
    environment VARCHAR(8) NOT NULL,
    client_key TEXT,
    client_id TEXT,
    secret_cipher TEXT,
    merchant_id TEXT,
    webhook_secret_cipher TEXT,
    extras_cipher TEXT,
    rotated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_provider_secrets_env_chk CHECK (environment IN ('TEST', 'LIVE')),
    CONSTRAINT payment_provider_secrets_unique UNIQUE (provider_id, environment)
);

COMMENT ON TABLE public.payment_provider_secrets IS
    'Ciphertext only. Full secrets are never returned by the admin API.';

CREATE TABLE public.payment_country_methods (
    id UUID PRIMARY KEY,
    payment_country CHAR(2) NOT NULL,
    merchant_country CHAR(2) NOT NULL,
    provider_id VARCHAR(64) NOT NULL REFERENCES public.payment_provider_configs (id),
    method_code VARCHAR(40) NOT NULL,
    currency CHAR(3) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_country_methods_unique UNIQUE (payment_country, merchant_country, provider_id, method_code, currency)
);

CREATE TABLE public.payment_fx_rates (
    id UUID PRIMARY KEY,
    base_currency CHAR(3) NOT NULL DEFAULT 'USD',
    charge_currency CHAR(3) NOT NULL,
    rate NUMERIC(24, 8) NOT NULL,
    basis VARCHAR(64) NOT NULL,
    rounding_mode VARCHAR(16) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    CONSTRAINT payment_fx_rate_positive CHECK (rate > 0),
    CONSTRAINT payment_fx_rounding_chk CHECK (rounding_mode IN ('HALF_UP', 'DOWN'))
);

CREATE TABLE public.payment_webhook_logs (
    id UUID PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    environment VARCHAR(8),
    event_id VARCHAR(128) NOT NULL,
    order_no VARCHAR(64),
    signature_valid BOOLEAN NOT NULL,
    duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    payload_hash CHAR(64),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_webhook_event
    ON public.payment_webhook_logs (provider_id, event_id)
    WHERE signature_valid = TRUE;

CREATE TABLE public.payment_error_logs (
    id UUID PRIMARY KEY,
    order_no VARCHAR(64),
    provider_id VARCHAR(64),
    code VARCHAR(64) NOT NULL,
    message VARCHAR(400) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payment_refunds (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.payment_orders (id),
    idempotency_key VARCHAR(80) NOT NULL,
    amount_minor BIGINT NOT NULL,
    credits BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_refunds_unique UNIQUE (order_id, idempotency_key),
    CONSTRAINT payment_refunds_positive CHECK (amount_minor > 0 AND credits > 0)
);

INSERT INTO public.payment_provider_configs (
    id, adapter_code, display_name, environment, countries, currencies, methods,
    contract_status, enabled, implemented, connection_status
) VALUES
    ('MOCK', 'MOCK', 'Mock PG', 'MOCK', 'KR,JP,PH,US', 'KRW,USD,JPY', 'MOCK_CARD',
     'TEST_READY', TRUE, TRUE, 'CONNECTED'),
    ('TOSS_DOMESTIC', 'TOSS', 'Toss Payments Domestic', 'TEST', 'KR', 'KRW', 'CARD,EASY_PAY',
     'NOT_CONFIGURED', FALSE, TRUE, 'NOT_CHECKED'),
    ('TOSS_INTERNATIONAL', 'TOSS', 'Toss Payments International', 'TEST', '', '', '',
     'APPROVAL_PENDING', FALSE, TRUE, 'NOT_CHECKED'),
    ('PAYPAL', 'PAYPAL', 'PayPal', 'TEST', 'US,PH,JP,AU', 'USD', 'PAYPAL',
     'NOT_CONFIGURED', FALSE, TRUE, 'NOT_CHECKED'),
    ('STRIPE', 'STRIPE', 'Stripe', 'TEST', '', '', 'CARD',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED'),
    ('WECHAT_PAY', 'WECHAT_PAY', 'WeChat Pay', 'TEST', 'CN', 'CNY', 'WECHAT',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED'),
    ('ALIPAY', 'ALIPAY', 'Alipay', 'TEST', 'CN', 'CNY', 'ALIPAY',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED'),
    ('GCASH', 'GCASH', 'GCash', 'TEST', 'PH', 'PHP', 'GCASH',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED'),
    ('MAYA', 'MAYA', 'Maya', 'TEST', 'PH', 'PHP', 'MAYA',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED'),
    ('JP_LOCAL', 'JP_LOCAL', 'Japan local cards and easy pay', 'TEST', 'JP', 'JPY', 'CARD',
     'NOT_CONFIGURED', FALSE, FALSE, 'NOT_CHECKED');

INSERT INTO public.payment_country_methods (
    id, payment_country, merchant_country, provider_id, method_code, currency, enabled
) VALUES
    ('11111111-1111-4111-8111-111111111101', 'KR', 'KR', 'MOCK', 'MOCK_CARD', 'KRW', TRUE),
    ('11111111-1111-4111-8111-111111111102', 'PH', 'KR', 'MOCK', 'MOCK_CARD', 'USD', TRUE),
    ('11111111-1111-4111-8111-111111111103', 'JP', 'KR', 'MOCK', 'MOCK_CARD', 'JPY', TRUE),
    ('11111111-1111-4111-8111-111111111104', 'US', 'KR', 'MOCK', 'MOCK_CARD', 'USD', TRUE),
    ('11111111-1111-4111-8111-111111111201', 'KR', 'KR', 'TOSS_DOMESTIC', 'CARD', 'KRW', FALSE),
    ('11111111-1111-4111-8111-111111111202', 'KR', 'KR', 'TOSS_DOMESTIC', 'EASY_PAY', 'KRW', FALSE),
    ('11111111-1111-4111-8111-111111111301', 'US', 'KR', 'PAYPAL', 'PAYPAL', 'USD', FALSE),
    ('11111111-1111-4111-8111-111111111302', 'PH', 'KR', 'PAYPAL', 'PAYPAL', 'USD', FALSE),
    ('11111111-1111-4111-8111-111111111303', 'JP', 'KR', 'PAYPAL', 'PAYPAL', 'USD', FALSE);
