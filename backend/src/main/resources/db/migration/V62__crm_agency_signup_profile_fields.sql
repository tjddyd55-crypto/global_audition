-- 기획사 가입 폼에서 받는 도시·부가 사업 정보를 CRM에 저장한다.
-- 기존 crm_agencies 행은 NULL로 유지하며, 결제·승인 정책은 변경하지 않는다.

ALTER TABLE public.crm_agencies
    ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.crm_agencies
    ADD COLUMN IF NOT EXISTS tax_id TEXT;

ALTER TABLE public.crm_agencies
    ADD COLUMN IF NOT EXISTS business_address TEXT;

ALTER TABLE public.crm_agencies
    ADD COLUMN IF NOT EXISTS established_year INTEGER;

ALTER TABLE public.crm_agencies
    ADD COLUMN IF NOT EXISTS business_license_document_url TEXT;

ALTER TABLE public.crm_agencies
    ADD CONSTRAINT crm_agencies_established_year_chk
        CHECK (established_year IS NULL OR (established_year >= 1800 AND established_year <= 2100));
