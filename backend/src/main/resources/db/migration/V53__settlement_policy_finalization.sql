-- 정산 정책 확정분. 기존 payment_orders / credit_transactions / contract_documents 는 수정하거나 삭제하지 않는다.
-- 2자리 금액은 정산 산출에만 쓴다. 지원 수수료와 결제 금액은 정수 USD 를 유지한다.

ALTER TABLE public.contract_versions
    ADD COLUMN IF NOT EXISTS refund_deduction_basis TEXT,
    ADD COLUMN IF NOT EXISTS payment_fee_deduction_basis TEXT,
    ADD COLUMN IF NOT EXISTS extra_deduction_basis TEXT;

ALTER TABLE public.contract_versions ALTER COLUMN rounding_policy DROP NOT NULL;
ALTER TABLE public.contract_versions ALTER COLUMN rounding_policy DROP DEFAULT;

COMMENT ON COLUMN public.contract_versions.refund_deduction_basis IS
    'Null until HQ sets DEDUCT_LINKED_REFUNDS or NONE. Unset blocks payout.';
COMMENT ON COLUMN public.contract_versions.payment_fee_deduction_basis IS
    'Null until HQ sets FIXED_USD or NONE. Unset blocks payout.';
COMMENT ON COLUMN public.contract_versions.extra_deduction_basis IS
    'Null until HQ sets FIXED_USD or NONE. Unset blocks payout.';

CREATE TABLE public.settlement_policies (
    id INT PRIMARY KEY,
    allocation_policy TEXT NOT NULL,
    revenue_recognition TEXT NOT NULL,
    breakage_liability TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT settlement_policies_singleton_chk CHECK (id = 1)
);

INSERT INTO public.settlement_policies (id, allocation_policy, revenue_recognition, breakage_liability)
VALUES (1, 'UNCONFIRMED', 'EXPERT_REVIEW_REQUIRED', 'EXPERT_REVIEW_REQUIRED');

COMMENT ON TABLE public.settlement_policies IS
    'UNCONFIRMED does not choose FIFO or LIFO. Mixed paid/free usage stays unpayable. Revenue recognition and breakage stay expert-review.';

CREATE TABLE public.credit_lots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    payment_order_id UUID,
    source_credit_transaction_id UUID,
    bucket TEXT NOT NULL,
    original_credits BIGINT NOT NULL,
    remaining_credits BIGINT NOT NULL,
    cash_collected_usd BIGINT,
    occurred_at TIMESTAMPTZ NOT NULL,
    parity_ok BOOLEAN NOT NULL,
    rebuilt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT credit_lots_bucket_chk CHECK (bucket IN ('PAID', 'FREE', 'UNCLASSIFIED')),
    CONSTRAINT credit_lots_credits_chk CHECK (original_credits > 0 AND remaining_credits >= 0 AND remaining_credits <= original_credits),
    CONSTRAINT credit_lots_payment_fk FOREIGN KEY (payment_order_id) REFERENCES public.payment_orders (id) ON DELETE CASCADE,
    CONSTRAINT credit_lots_source_fk FOREIGN KEY (source_credit_transaction_id) REFERENCES public.credit_transactions (id) ON DELETE CASCADE
);

CREATE INDEX idx_credit_lots_user_time ON public.credit_lots (user_id, occurred_at);
CREATE INDEX idx_credit_lots_payment ON public.credit_lots (payment_order_id);

COMMENT ON TABLE public.credit_lots IS
    'Derived cache from the payment and credit ledgers. Rebuilt without updating those ledgers.';

CREATE TABLE public.credit_lot_allocations (
    id UUID PRIMARY KEY,
    usage_credit_transaction_id UUID NOT NULL UNIQUE,
    lot_id UUID,
    bucket TEXT,
    credits BIGINT NOT NULL,
    payable_usd BIGINT,
    status TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT credit_lot_allocations_status_chk CHECK (status IN ('ALLOCATED', 'ALLOCATION_POLICY_PENDING')),
    CONSTRAINT credit_lot_allocations_usage_fk FOREIGN KEY (usage_credit_transaction_id) REFERENCES public.credit_transactions (id) ON DELETE CASCADE,
    CONSTRAINT credit_lot_allocations_lot_fk FOREIGN KEY (lot_id) REFERENCES public.credit_lots (id) ON DELETE CASCADE
);

CREATE INDEX idx_credit_lot_allocations_lot ON public.credit_lot_allocations (lot_id);

ALTER TABLE public.monthly_settlements
    ADD COLUMN IF NOT EXISTS payout_currency CHAR(3),
    ADD COLUMN IF NOT EXISTS settlement_base_raw NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS settlement_base_final NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS settlement_base_rounding_diff NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS compensation_raw NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS compensation_final NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS compensation_rounding_diff NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS hq_share_raw NUMERIC(24, 8),
    ADD COLUMN IF NOT EXISTS hq_share_final NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS hq_share_rounding_diff NUMERIC(24, 8);

ALTER TABLE public.monthly_settlements DROP CONSTRAINT IF EXISTS monthly_settlements_status_chk;
ALTER TABLE public.monthly_settlements ADD CONSTRAINT monthly_settlements_status_chk CHECK (status IN (
    'DRAFT', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'ADJUSTMENT_REQUIRED',
    'NEEDS_CONFIRMATION', 'ALLOCATION_POLICY_PENDING', 'REFUND_ALLOCATION_PENDING'
));

ALTER TABLE public.monthly_settlements DROP CONSTRAINT IF EXISTS monthly_settlements_no_payout_when_unconfirmed;
ALTER TABLE public.monthly_settlements ADD CONSTRAINT monthly_settlements_no_payout_when_unconfirmed CHECK (
    status NOT IN ('NEEDS_CONFIRMATION', 'ALLOCATION_POLICY_PENDING', 'REFUND_ALLOCATION_PENDING')
    OR (
        compensation_usd IS NULL AND hq_share_usd IS NULL
        AND compensation_final IS NULL AND hq_share_final IS NULL
    )
);

ALTER TABLE public.monthly_settlements DROP CONSTRAINT IF EXISTS monthly_settlements_identity_chk;
ALTER TABLE public.monthly_settlements ADD CONSTRAINT monthly_settlements_identity_chk CHECK (
    status NOT IN ('CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'ADJUSTMENT_REQUIRED')
    OR (
        settlement_base_final IS NOT NULL
        AND compensation_final IS NOT NULL
        AND hq_share_final = settlement_base_final - compensation_final
    )
);

COMMENT ON COLUMN public.monthly_settlements.compensation_raw IS
    'Aggregate rate applied once. Not rounded per source transaction.';
COMMENT ON COLUMN public.monthly_settlements.compensation_final IS
    'USD scale 2, HALF_UP from compensation_raw. Null when payout is not computed.';
COMMENT ON COLUMN public.monthly_settlements.compensation_rounding_diff IS
    'compensation_final - compensation_raw.';

CREATE TABLE public.payout_fx_records (
    id UUID PRIMARY KEY,
    settlement_id UUID NOT NULL UNIQUE REFERENCES public.monthly_settlements (id) ON DELETE CASCADE,
    payout_currency CHAR(3) NOT NULL,
    fx_rate NUMERIC(18, 8),
    rate_date DATE,
    rate_source TEXT,
    remittance_fee NUMERIC(18, 2),
    actual_paid_amount NUMERIC(18, 2),
    paid_date DATE,
    approver_id UUID,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payout_fx_status_chk CHECK (status IN ('FX_INCOMPLETE', 'FX_RECORDED')),
    CONSTRAINT payout_fx_currency_chk CHECK (payout_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT payout_fx_final_chk CHECK (
        status <> 'FX_RECORDED' OR (
            fx_rate IS NOT NULL AND fx_rate > 0
            AND rate_date IS NOT NULL AND rate_source IS NOT NULL AND length(trim(rate_source)) > 0
            AND remittance_fee IS NOT NULL AND actual_paid_amount IS NOT NULL
            AND paid_date IS NOT NULL AND approver_id IS NOT NULL
        )
    )
);

COMMENT ON TABLE public.payout_fx_records IS
    'Manual verified rate. No FX provider and no bank transfer is called. Incomplete rows do not finalize actual_paid_amount.';

CREATE TABLE public.payout_fx_audit (
    id UUID PRIMARY KEY,
    fx_record_id UUID NOT NULL,
    settlement_id UUID NOT NULL,
    action TEXT NOT NULL,
    before_state TEXT,
    after_state TEXT NOT NULL,
    actor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payout_fx_audit_action_chk CHECK (action IN ('CREATE', 'UPDATE'))
);

CREATE INDEX idx_payout_fx_audit_settlement ON public.payout_fx_audit (settlement_id, created_at);

CREATE TABLE public.contract_files (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts (id) ON DELETE CASCADE,
    contract_version_id UUID REFERENCES public.contract_versions (id),
    legacy_document_id UUID,
    storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime TEXT NOT NULL,
    sha256 CHAR(64) NOT NULL,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    integrity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    CONSTRAINT contract_files_size_chk CHECK (size_bytes > 0),
    CONSTRAINT contract_files_hash_chk CHECK (sha256 ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_contract_files_contract ON public.contract_files (contract_id, uploaded_at DESC);

COMMENT ON TABLE public.contract_files IS
    'Private object metadata only. No public URL. contract_documents bytea stays until a separate approved deletion.';
