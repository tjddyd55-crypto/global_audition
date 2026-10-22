-- 거래 시점 귀속과 월 정산. credit_transactions / payment_orders 는 수정하지 않는다.
-- 크레딧 사용 금액을 현금 매출로 복사하지 않는다.

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS posting_branch_id UUID;

COMMENT ON COLUMN public.auditions.posting_branch_id IS
    'CRM branch that posted the audition. Null is not guessed. Audience country_code is not the legal branch.';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'auditions_posting_branch_fk'
    ) THEN
        ALTER TABLE public.auditions
            ADD CONSTRAINT auditions_posting_branch_fk
            FOREIGN KEY (posting_branch_id) REFERENCES public.crm_agencies (id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auditions_posting_branch ON public.auditions (posting_branch_id);

CREATE TABLE public.revenue_attributions (
    id UUID PRIMARY KEY,
    credit_transaction_id UUID,
    payment_order_id UUID,
    line_kind TEXT NOT NULL,
    recognition TEXT NOT NULL,
    crm_agency_id UUID,
    branch_id UUID,
    attributed_country CHAR(2),
    audition_id UUID,
    application_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL,
    applied_fee_usd BIGINT,
    collected_usd BIGINT,
    payment_status TEXT,
    refund_status TEXT,
    contract_id UUID,
    contract_version_id UUID,
    cash_mapping_policy TEXT NOT NULL,
    confirmation_state TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT revenue_attributions_kind_chk CHECK (line_kind IN ('REVENUE', 'REFUND', 'FEE')),
    CONSTRAINT revenue_attributions_recognition_chk CHECK (recognition IN ('ACCOUNTING', 'SALES')),
    CONSTRAINT revenue_attributions_confirm_chk CHECK (confirmation_state IN ('ATTRIBUTED', 'NEEDS_CONFIRMATION')),
    CONSTRAINT revenue_attributions_source_chk CHECK (
        credit_transaction_id IS NOT NULL OR payment_order_id IS NOT NULL
    ),
    CONSTRAINT revenue_attributions_credit_fk
        FOREIGN KEY (credit_transaction_id) REFERENCES public.credit_transactions (id) ON DELETE RESTRICT,
    CONSTRAINT revenue_attributions_payment_fk
        FOREIGN KEY (payment_order_id) REFERENCES public.payment_orders (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_revenue_attr_credit
    ON public.revenue_attributions (credit_transaction_id, line_kind)
    WHERE credit_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX ux_revenue_attr_payment
    ON public.revenue_attributions (payment_order_id, line_kind)
    WHERE payment_order_id IS NOT NULL;

COMMENT ON COLUMN public.revenue_attributions.collected_usd IS
    'Cash actually collected, copied from a payment order. Null on credit usage. Not derived from applied_fee_usd.';
COMMENT ON COLUMN public.revenue_attributions.cash_mapping_policy IS
    'UNDECIDED for credit usage. CASH_COLLECTED when the amount is the payment order amount.';
COMMENT ON TABLE public.revenue_attributions IS
    'Snapshot at reconcile time. Later agency country changes do not update these rows.';

CREATE TABLE public.monthly_settlements (
    id UUID PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES public.countries (code),
    contract_id UUID NOT NULL REFERENCES public.contracts (id),
    period_key CHAR(7) NOT NULL,
    status TEXT NOT NULL,
    target_revenue_usd BIGINT,
    refunds_usd BIGINT,
    payment_fees_usd BIGINT,
    extra_deductions_usd BIGINT,
    settlement_base_usd BIGINT,
    compensation_usd BIGINT,
    hq_share_usd BIGINT,
    rate_bps INT,
    settlement_basis TEXT,
    rounding_policy TEXT,
    payout_note TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    payout_recorded_by UUID,
    payout_recorded_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT monthly_settlements_period_chk CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT monthly_settlements_status_chk CHECK (status IN (
        'DRAFT', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'ADJUSTMENT_REQUIRED', 'NEEDS_CONFIRMATION'
    )),
    CONSTRAINT monthly_settlements_unique UNIQUE (country_code, contract_id, period_key),
    CONSTRAINT monthly_settlements_no_payout_when_unconfirmed CHECK (
        status <> 'NEEDS_CONFIRMATION' OR (compensation_usd IS NULL AND hq_share_usd IS NULL)
    ),
    CONSTRAINT monthly_settlements_identity_chk CHECK (
        status NOT IN ('CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'ADJUSTMENT_REQUIRED')
        OR (
            settlement_base_usd IS NOT NULL
            AND compensation_usd IS NOT NULL
            AND hq_share_usd = settlement_base_usd - compensation_usd
        )
    )
);

COMMENT ON TABLE public.monthly_settlements IS
    'Manual payout record only. No bank transfer is issued from this table.';

CREATE TABLE public.settlement_lines (
    id UUID PRIMARY KEY,
    settlement_id UUID NOT NULL REFERENCES public.monthly_settlements (id),
    attribution_id UUID NOT NULL REFERENCES public.revenue_attributions (id),
    CONSTRAINT settlement_lines_attribution_unique UNIQUE (attribution_id)
);

CREATE TABLE public.settlement_adjustments (
    id UUID PRIMARY KEY,
    settlement_id UUID NOT NULL REFERENCES public.monthly_settlements (id),
    reason TEXT NOT NULL,
    delta_base_usd BIGINT,
    actor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlement_adjustments_settlement
    ON public.settlement_adjustments (settlement_id, created_at);
