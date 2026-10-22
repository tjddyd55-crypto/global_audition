-- 국가/상대방 계약. 요율과 정산 기준은 기본값을 두지 않는다.
-- 과거 버전은 삭제하지 않는다. 결제·원장 행은 수정하지 않는다.

CREATE TABLE public.contracts (
    id UUID PRIMARY KEY,
    contract_number TEXT NOT NULL UNIQUE,
    country_code CHAR(2) NOT NULL REFERENCES public.countries (code),
    crm_agency_id UUID REFERENCES public.crm_agencies (id),
    counterparty_name TEXT NOT NULL,
    representative_user_id UUID,
    contracting_entity TEXT,
    status TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    CONSTRAINT contracts_status_chk CHECK (status IN ('DRAFT', 'ACTIVE', 'ENDED'))
);

CREATE INDEX idx_contracts_country ON public.contracts (country_code, status);

CREATE TABLE public.contract_versions (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts (id),
    version_no INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    revenue_share_bps INT,
    settlement_basis TEXT,
    rounding_policy TEXT NOT NULL DEFAULT 'UNDECIDED',
    payout_currency CHAR(3) NOT NULL,
    cycle TEXT NOT NULL DEFAULT 'MONTHLY',
    payment_fee_usd BIGINT,
    extra_deduction_usd BIGINT,
    approved_by UUID,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT contract_versions_unique UNIQUE (contract_id, version_no),
    CONSTRAINT contract_versions_rate_chk CHECK (
        revenue_share_bps IS NULL OR (revenue_share_bps >= 0 AND revenue_share_bps <= 10000)
    ),
    CONSTRAINT contract_versions_currency_chk CHECK (payout_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT contract_versions_cycle_chk CHECK (cycle = 'MONTHLY'),
    CONSTRAINT contract_versions_dates_chk CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT contract_versions_fee_chk CHECK (payment_fee_usd IS NULL OR payment_fee_usd >= 0),
    CONSTRAINT contract_versions_extra_chk CHECK (extra_deduction_usd IS NULL OR extra_deduction_usd >= 0)
);

COMMENT ON COLUMN public.contract_versions.revenue_share_bps IS
    'Null until HQ sets it. 10000 = 100 percent. Country examples are not seeded.';
COMMENT ON COLUMN public.contract_versions.settlement_basis IS
    'Null until HQ sets it. CASH_COLLECTED is the only basis the engine will calculate. Credit-usage cash mapping is not implied.';
COMMENT ON COLUMN public.contract_versions.rounding_policy IS
    'UNDECIDED: fractional USD (base * bps not divisible by 10000) is not computed and not rounded.';
COMMENT ON COLUMN public.contract_versions.payment_fee_usd IS
    'Null means the contractual payment fee is unset. Zero is an explicit HQ value, not a default.';
COMMENT ON COLUMN public.contract_versions.extra_deduction_usd IS
    'Null means extra deductions are unset. Zero is an explicit HQ value, not a default.';

CREATE TABLE public.contract_documents (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts (id),
    version_id UUID NOT NULL REFERENCES public.contract_versions (id),
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    body BYTEA NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_documents_contract ON public.contract_documents (contract_id, created_at DESC);
