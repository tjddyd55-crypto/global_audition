-- 기획사 CRM과 승인 이력. 기존 users·applications 행은 수정하지 않는다.

CREATE TABLE public.crm_agencies (
    id UUID PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES public.countries (code),
    display_name TEXT NOT NULL,
    legal_name TEXT,
    business_registration TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    assigned_staff_user_id UUID,
    stage TEXT NOT NULL,
    approval_state TEXT NOT NULL,
    linked_user_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_agencies_stage_chk CHECK (stage IN (
        'LEAD', 'CONTACTED', 'MEETING', 'REVIEW', 'CONTRACTED', 'ACTIVE',
        'STOPPED', 'REJECTED', 'DORMANT'
    )),
    CONSTRAINT crm_agencies_approval_chk CHECK (approval_state IN (
        'PENDING', 'COUNTRY_REVIEW', 'HQ_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'
    ))
);

CREATE INDEX idx_crm_agencies_country ON public.crm_agencies (country_code, approval_state);

ALTER TABLE public.country_staff_agencies
    ADD CONSTRAINT country_staff_agencies_crm_fk
        FOREIGN KEY (crm_agency_id) REFERENCES public.crm_agencies (id);

CREATE TABLE public.crm_stage_events (
    id UUID PRIMARY KEY,
    crm_agency_id UUID NOT NULL REFERENCES public.crm_agencies (id),
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    actor_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_approval_events (
    id UUID PRIMARY KEY,
    crm_agency_id UUID NOT NULL REFERENCES public.crm_agencies (id),
    from_state TEXT,
    to_state TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_activities (
    id UUID PRIMARY KEY,
    crm_agency_id UUID NOT NULL REFERENCES public.crm_agencies (id),
    country_code CHAR(2) NOT NULL,
    actor_id UUID NOT NULL,
    kind TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_country ON public.crm_activities (country_code, created_at DESC);
