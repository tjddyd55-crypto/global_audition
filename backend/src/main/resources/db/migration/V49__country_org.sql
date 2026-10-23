-- 국가 조직. 기존 users.role 값과 결제·원장 행은 바꾸지 않는다.
-- 국가별 요율은 여기 두지 않는다.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
        CHECK (role IN (
            'APPLICANT', 'AGENCY', 'ADMIN', 'SUPER_ADMIN', 'USER',
            'GLOBAL_SUPER_ADMIN', 'COUNTRY_ADMIN', 'COUNTRY_STAFF', 'AGENCY_ADMIN'
        ));

CREATE TABLE public.countries (
    code CHAR(2) PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    default_currency CHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT countries_code_iso CHECK (code ~ '^[A-Z]{2}$'),
    CONSTRAINT countries_status_chk CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT countries_currency_chk CHECK (default_currency ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE public.countries IS
    'ISO 3166-1 alpha-2 operating country. Rates are not stored here.';

CREATE TABLE public.country_admin_appointments (
    id UUID PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES public.countries (code),
    user_id UUID NOT NULL REFERENCES public.users (id),
    status TEXT NOT NULL,
    appointed_by UUID,
    appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    end_reason TEXT,
    successor_appointment_id UUID,
    CONSTRAINT country_admin_appointments_status_chk CHECK (status IN ('ACTIVE', 'ENDED'))
);

CREATE UNIQUE INDEX ux_country_one_active_rep
    ON public.country_admin_appointments (country_code)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_country_admin_appointments_user
    ON public.country_admin_appointments (user_id, status);

CREATE TABLE public.country_staff_assignments (
    id UUID PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES public.countries (code),
    user_id UUID NOT NULL REFERENCES public.users (id),
    status TEXT NOT NULL,
    appointed_by UUID,
    appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    CONSTRAINT country_staff_assignments_status_chk CHECK (status IN ('ACTIVE', 'ENDED'))
);

CREATE UNIQUE INDEX ux_country_staff_one_active
    ON public.country_staff_assignments (country_code, user_id)
    WHERE status = 'ACTIVE';

CREATE TABLE public.country_permission_catalog (
    permission TEXT PRIMARY KEY,
    grantable_by_country_admin BOOLEAN NOT NULL
);

INSERT INTO public.country_permission_catalog (permission, grantable_by_country_admin) VALUES
    ('CRM_READ', TRUE),
    ('CRM_WRITE', TRUE),
    ('CONSULT_LOG', TRUE),
    ('AGENCY_REVIEW', TRUE),
    ('CONTRACT_TERMS', FALSE),
    ('SETTLEMENT_APPROVE', FALSE),
    ('RATE_EDIT', FALSE);

CREATE TABLE public.country_staff_agencies (
    assignment_id UUID NOT NULL REFERENCES public.country_staff_assignments (id),
    crm_agency_id UUID NOT NULL,
    PRIMARY KEY (assignment_id, crm_agency_id)
);

CREATE TABLE public.country_staff_permissions (
    assignment_id UUID NOT NULL REFERENCES public.country_staff_assignments (id),
    permission TEXT NOT NULL REFERENCES public.country_permission_catalog (permission),
    PRIMARY KEY (assignment_id, permission)
);

CREATE TABLE public.country_org_audit (
    id UUID PRIMARY KEY,
    action TEXT NOT NULL,
    actor_id UUID,
    country_code CHAR(2),
    target_type TEXT NOT NULL,
    target_id TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_country_org_audit_country
    ON public.country_org_audit (country_code, created_at DESC);
