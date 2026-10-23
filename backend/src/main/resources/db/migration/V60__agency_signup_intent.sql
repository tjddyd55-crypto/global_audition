-- 가입 요청 유형은 접근 역할과 분리한다. 기존 AGENCY 계정만 요청 유형을 맞춘다.
-- 결제·크레딧·정산 원장은 변경하지 않는다.

ALTER TABLE public.users
    ADD COLUMN signup_intent TEXT NOT NULL DEFAULT 'APPLICANT';

ALTER TABLE public.users
    ADD CONSTRAINT users_signup_intent_chk CHECK (signup_intent IN ('APPLICANT', 'AGENCY'));

UPDATE public.users
SET signup_intent = 'AGENCY'
WHERE role = 'AGENCY';
