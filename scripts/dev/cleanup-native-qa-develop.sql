-- =============================================================================
-- DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
-- Removes [DEV-QA] seed rows by fixed UUID. Does not touch real users.
-- SAFETY: refuses (whole transaction aborts) when
--   * app.qa_seed_env is not 'development'
--   * any credit ledger row references a QA audition (fee was charged), or
--     any QA user has ledger rows other than its own QA_SEED grant
--   * any QA audition has applications not created by the seed (ids 20..23)
-- so it can never delete an audition with real application history or leave
-- orphan fee ledgers behind. The seed itself never calls cleanup.
-- =============================================================================

BEGIN;

DO $guard$
DECLARE
  qa_auditions text[] := ARRAY[
    '00000010-0000-4000-8000-000000000010','00000011-0000-4000-8000-000000000011',
    '00000012-0000-4000-8000-000000000012','00000013-0000-4000-8000-000000000013',
    '00000014-0000-4000-8000-000000000014','00000015-0000-4000-8000-000000000015'];
  qa_users uuid[] := ARRAY[
    '00000001-0000-4000-8000-000000000001','00000002-0000-4000-8000-000000000002',
    '00000003-0000-4000-8000-000000000003','00000004-0000-4000-8000-000000000004',
    '00000005-0000-4000-8000-000000000005','00000006-0000-4000-8000-000000000006']::uuid[];
  n bigint;
BEGIN
  IF coalesce(current_setting('app.qa_seed_env', true), '') <> 'development' THEN
    RAISE EXCEPTION 'QA cleanup refused: app.qa_seed_env is not development';
  END IF;
  SELECT count(*) INTO n FROM public.credit_transactions WHERE reference_id = ANY(qa_auditions);
  IF n > 0 THEN
    RAISE EXCEPTION 'QA cleanup refused: % ledger row(s) reference QA auditions', n;
  END IF;
  SELECT count(*) INTO n FROM public.credit_transactions
   WHERE user_id = ANY(qa_users) AND NOT (type = 'GRANT' AND reason = 'QA_SEED' AND reference_id = 'QA_SEED:' || user_id::text);
  IF n > 0 THEN
    RAISE EXCEPTION 'QA cleanup refused: % non-seed ledger row(s) on QA users', n;
  END IF;
  SELECT count(*) INTO n FROM public.applications
   WHERE audition_id::text = ANY(qa_auditions)
     AND id NOT IN ('00000020-0000-4000-8000-000000000020','00000021-0000-4000-8000-000000000021',
                    '00000022-0000-4000-8000-000000000022','00000023-0000-4000-8000-000000000023');
  IF n > 0 THEN
    RAISE EXCEPTION 'QA cleanup refused: % non-seed application(s) on QA auditions', n;
  END IF;
END
$guard$;

-- votes for QA auditions / applications
DELETE FROM public.votes
WHERE audition_id IN (
  '00000010-0000-4000-8000-000000000010'::uuid,
  '00000011-0000-4000-8000-000000000011'::uuid,
  '00000012-0000-4000-8000-000000000012'::uuid,
  '00000013-0000-4000-8000-000000000013'::uuid,
  '00000014-0000-4000-8000-000000000014'::uuid,
  '00000015-0000-4000-8000-000000000015'::uuid
)
OR application_id IN (
  '00000020-0000-4000-8000-000000000020'::uuid,
  '00000021-0000-4000-8000-000000000021'::uuid,
  '00000022-0000-4000-8000-000000000022'::uuid,
  '00000023-0000-4000-8000-000000000023'::uuid
);

DELETE FROM public.application_scores
WHERE application_id IN (
  '00000020-0000-4000-8000-000000000020'::uuid,
  '00000021-0000-4000-8000-000000000021'::uuid,
  '00000022-0000-4000-8000-000000000022'::uuid,
  '00000023-0000-4000-8000-000000000023'::uuid
);

DELETE FROM public.application_videos
WHERE id IN (
  '00000030-0000-4000-8000-000000000030'::uuid,
  '00000031-0000-4000-8000-000000000031'::uuid,
  '00000032-0000-4000-8000-000000000032'::uuid,
  '00000033-0000-4000-8000-000000000033'::uuid
)
OR application_id IN (
  '00000020-0000-4000-8000-000000000020'::uuid,
  '00000021-0000-4000-8000-000000000021'::uuid,
  '00000022-0000-4000-8000-000000000022'::uuid,
  '00000023-0000-4000-8000-000000000023'::uuid
);

DELETE FROM public.applications
WHERE id IN (
  '00000020-0000-4000-8000-000000000020'::uuid,
  '00000021-0000-4000-8000-000000000021'::uuid,
  '00000022-0000-4000-8000-000000000022'::uuid,
  '00000023-0000-4000-8000-000000000023'::uuid
);

DELETE FROM public.auditions
WHERE id IN (
  '00000010-0000-4000-8000-000000000010'::uuid,
  '00000011-0000-4000-8000-000000000011'::uuid,
  '00000012-0000-4000-8000-000000000012'::uuid,
  '00000013-0000-4000-8000-000000000013'::uuid,
  '00000014-0000-4000-8000-000000000014'::uuid,
  '00000015-0000-4000-8000-000000000015'::uuid
);

DELETE FROM public.channel_videos
WHERE id IN (
  '00000041-0000-4000-8000-000000000041'::uuid,
  '00000042-0000-4000-8000-000000000042'::uuid
);

DELETE FROM public.channels
WHERE id = '00000040-0000-4000-8000-000000000040'::uuid;

DELETE FROM public.channel_subscriptions
WHERE channel_owner_id = '00000001-0000-4000-8000-000000000001'::uuid;

-- wallet and its QA_SEED grant are removed together (balance/ledger stay consistent)
DELETE FROM public.credit_transactions
WHERE type = 'GRANT' AND reason = 'QA_SEED' AND reference_id = 'QA_SEED:' || user_id::text
  AND user_id IN (
  '00000001-0000-4000-8000-000000000001'::uuid,
  '00000002-0000-4000-8000-000000000002'::uuid,
  '00000003-0000-4000-8000-000000000003'::uuid,
  '00000004-0000-4000-8000-000000000004'::uuid,
  '00000005-0000-4000-8000-000000000005'::uuid,
  '00000006-0000-4000-8000-000000000006'::uuid
);

DELETE FROM public.user_credits
WHERE user_id IN (
  '00000006-0000-4000-8000-000000000006'::uuid,
  '00000001-0000-4000-8000-000000000001'::uuid,
  '00000002-0000-4000-8000-000000000002'::uuid,
  '00000003-0000-4000-8000-000000000003'::uuid,
  '00000004-0000-4000-8000-000000000004'::uuid,
  '00000005-0000-4000-8000-000000000005'::uuid
);

DELETE FROM public.users
WHERE id IN (
  '00000006-0000-4000-8000-000000000006'::uuid,
  '00000001-0000-4000-8000-000000000001'::uuid,
  '00000002-0000-4000-8000-000000000002'::uuid,
  '00000003-0000-4000-8000-000000000003'::uuid,
  '00000004-0000-4000-8000-000000000004'::uuid,
  '00000005-0000-4000-8000-000000000005'::uuid
);

COMMIT;
