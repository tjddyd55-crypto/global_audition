-- =============================================================================
-- DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
-- Native User real-data E2E seed (idempotent: fixed UUIDs + ON CONFLICT DO NOTHING,
-- credits only via QA_SEED:<user> ledger rows). Never run cleanup before seed.
-- Target: Railway environment "development" only
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Environment guard: runner must SET app.qa_seed_env = 'development'
--    (run-native-qa-seed.py does so only after its host/env checks pass).
-- ---------------------------------------------------------------------------
DO $guard$
BEGIN
  IF coalesce(current_setting('app.qa_seed_env', true), '') <> 'development' THEN
    RAISE EXCEPTION 'QA seed refused: app.qa_seed_env is not development';
  END IF;
END
$guard$;

-- Shared QA password hash (qa123456) — copied from existing develop p0qa account
-- DO NOT use in production.

-- ---------------------------------------------------------------------------
-- Constants (fixed UUIDs)
-- ---------------------------------------------------------------------------
-- Agency owner: 00000001-0000-4000-8000-000000000001
-- Vote candidates: 00000002..04
-- Auditions: 10 fresh OPEN, 11 CLOSED, 12/13 series R1/R2, 14 vote, 15 existing apply
-- Applications: 20 qa-dev-applicant existing, 21-23 vote candidates
-- Channel: 40, Videos: 41-42
-- QA applicant (dedicated, seed-owned): 00000006-0000-4000-8000-000000000006
-- Existing non-QA accounts (e.g. p0qa) are NEVER touched by this seed.

-- ---------------------------------------------------------------------------
-- 1) QA users (agency + vote candidates)
-- ---------------------------------------------------------------------------
INSERT INTO public.users (
  id, email, password_hash, role, nickname, username, display_name,
  account_status, is_channel_public, channel_categories, created_at, updated_at
) VALUES
  (
    '00000001-0000-4000-8000-000000000001',
    'qa-dev-agency@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'AGENCY', 'qa_dev_agency', 'qa_dev_agency', 'qa_dev_agency',
    'ACTIVE', false, '{}', now(), now()
  ),
  (
    '00000002-0000-4000-8000-000000000002',
    'qa-dev-vote-b@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'APPLICANT', 'qa_vote_b', 'qa_vote_b', 'qa_vote_b',
    'ACTIVE', false, '{}', now(), now()
  ),
  (
    '00000003-0000-4000-8000-000000000003',
    'qa-dev-vote-c@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'APPLICANT', 'qa_vote_c', 'qa_vote_c', 'qa_vote_c',
    'ACTIVE', false, '{}', now(), now()
  ),
  (
    '00000004-0000-4000-8000-000000000004',
    'qa-dev-vote-d@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'APPLICANT', 'qa_vote_d', 'qa_vote_d', 'qa_vote_d',
    'ACTIVE', false, '{}', now(), now()
  ),
  (
    '00000005-0000-4000-8000-000000000005',
    'qa-dev-channel@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'APPLICANT', 'qa_dev_channel', 'qa_dev_channel', 'qa_dev_channel',
    'ACTIVE', true, ARRAY['Vocal','Dance'], now(), now()
  ),
  (
    '00000006-0000-4000-8000-000000000006',
    'qa-dev-applicant@audition.local',
    '$2a$10$9yspT0ms/99tCH41Ow1Yfe8b8TfT4yADSpfozl7Xb1tNGajC9foLu',
    'APPLICANT', 'qa_dev_applicant', 'qa_dev_applicant', 'qa_dev_applicant',
    'ACTIVE', false, '{}', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) QA applicant credits — granted ONLY through a ledger row.
--    Wallet row is created at 0 if missing (never overwritten). A GRANT/QA_SEED
--    row with reference_id 'QA_SEED:<user>' is inserted at most once, and the
--    wallet is incremented in the same statement, so ledger sum == balance.
--    The wallet row is locked first, so concurrent seed runs serialise.
-- ---------------------------------------------------------------------------
INSERT INTO public.user_credits (user_id, balance, updated_at)
VALUES ('00000006-0000-4000-8000-000000000006'::uuid, 0, now())
ON CONFLICT (user_id) DO NOTHING;

DO $grant$
DECLARE
  qa_user  uuid := '00000006-0000-4000-8000-000000000006';
  qa_ref   text := 'QA_SEED:00000006-0000-4000-8000-000000000006';
  qa_grant bigint := 10;
  cur_bal  bigint;
BEGIN
  SELECT balance INTO cur_bal FROM public.user_credits WHERE user_id = qa_user FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = qa_user AND reference_id = qa_ref) THEN
    UPDATE public.user_credits SET balance = cur_bal + qa_grant, updated_at = now() WHERE user_id = qa_user;
    INSERT INTO public.credit_transactions
      (id, user_id, amount, type, reason, reference_id, note, before_balance, after_balance, created_at)
    VALUES
      (gen_random_uuid(), qa_user, qa_grant, 'GRANT', 'QA_SEED', qa_ref,
       'DEV-QA seed grant (development only, free credits)', cur_bal, cur_bal + qa_grant, now());
  END IF;
END
$grant$;

-- ---------------------------------------------------------------------------
-- 3) Auditions
-- ---------------------------------------------------------------------------
INSERT INTO public.auditions (
  id, owner_id, title, description, status,
  country_code, deadline_at, start_date, end_date,
  cover_image, image_original_url, image_medium_url, image_thumb_url,
  gallery_images, agency_name, agency_logo, applicants_count, remaining_days,
  recruit_fields, location, benefits, qualifications, schedules,
  process_mode, group_id, series_round,
  created_at, updated_at
) VALUES
  (
    '00000010-0000-4000-8000-000000000010',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Open Audition (Fresh Apply)',
    'Development QA seed — fresh apply target for qa-dev-applicant.',
    'OPEN', 'KR', now() + interval '30 days', now(), now() + interval '30 days',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    '{}', 'QA Dev Agency', NULL, 0, 30,
    ARRAY['보컬','댄스'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000010-0000-4000-8000-000000000010', 1,
    now(), now()
  ),
  (
    '00000011-0000-4000-8000-000000000011',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Closed Audition',
    'Development QA seed — apply gate closed.',
    'CLOSED', 'KR', now() - interval '1 day', now() - interval '30 days', now() - interval '1 day',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    '{}', 'QA Dev Agency', NULL, 0, 0,
    ARRAY['보컬'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000011-0000-4000-8000-000000000011', 1,
    now(), now()
  ),
  (
    '00000012-0000-4000-8000-000000000012',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Round 1 Audition',
    'Development QA seed — series round 1.',
    'OPEN', 'KR', now() + interval '30 days', now(), now() + interval '30 days',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    '{}', 'QA Dev Agency', NULL, 0, 30,
    ARRAY['보컬'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000012-0000-4000-8000-000000000012', 1,
    now(), now()
  ),
  (
    '00000013-0000-4000-8000-000000000013',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Round 2 Audition',
    'Development QA seed — series round 2.',
    'OPEN', 'KR', now() + interval '30 days', now(), now() + interval '30 days',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    '{}', 'QA Dev Agency', NULL, 0, 30,
    ARRAY['보컬'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000012-0000-4000-8000-000000000012', 2,
    now(), now()
  ),
  (
    '00000014-0000-4000-8000-000000000014',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Vote Enabled Audition',
    'Development QA seed — public vote board with 3 candidates.',
    'OPEN', 'KR', now() + interval '30 days', now(), now() + interval '30 days',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
    '{}', 'QA Dev Agency', NULL, 3, 30,
    ARRAY['보컬','댄스','랩'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000014-0000-4000-8000-000000000014', 1,
    now(), now()
  ),
  (
    '00000015-0000-4000-8000-000000000015',
    '00000001-0000-4000-8000-000000000001',
    '[DEV-QA] Existing Application Audition',
    'Development QA seed — qa-dev-applicant already applied.',
    'OPEN', 'KR', now() + interval '30 days', now(), now() + interval '30 days',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200',
    '{}', 'QA Dev Agency', NULL, 1, 30,
    ARRAY['보컬'], 'Seoul', '{}', '{}', '{}',
    'SINGLE', '00000015-0000-4000-8000-000000000015', 1,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Applications + videos
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (
  id, audition_id, applicant_id, status, vote_count,
  current_round_number, final_status, latest_result_status,
  applicant_name, video_url, nationality, created_at, updated_at
) VALUES
  (
    '00000020-0000-4000-8000-000000000020',
    '00000015-0000-4000-8000-000000000015',
    '00000006-0000-4000-8000-000000000006',
    'SUBMITTED', 0, 1, 'IN_PROGRESS', 'PENDING',
    'QA Dev Applicant', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'KR', now() - interval '2 days', now()
  ),
  (
    '00000021-0000-4000-8000-000000000021',
    '00000014-0000-4000-8000-000000000014',
    '00000002-0000-4000-8000-000000000002',
    'SUBMITTED', 5, 1, 'IN_PROGRESS', 'PENDING',
    'Vote B', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'KR', now(), now()
  ),
  (
    '00000022-0000-4000-8000-000000000022',
    '00000014-0000-4000-8000-000000000014',
    '00000003-0000-4000-8000-000000000003',
    'REVIEWING', 3, 1, 'IN_PROGRESS', 'PENDING',
    'Vote C', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'KR', now(), now()
  ),
  (
    '00000023-0000-4000-8000-000000000023',
    '00000014-0000-4000-8000-000000000014',
    '00000004-0000-4000-8000-000000000004',
    'ACCEPTED', 1, 1, 'IN_PROGRESS', 'PENDING',
    'Vote D', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'KR', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_videos (
  id, application_id, video_url, title, category, view_count, like_count, created_at, updated_at
) VALUES
  ('00000030-0000-4000-8000-000000000030', '00000020-0000-4000-8000-000000000020', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'QA Applicant Video', '보컬', 10, 2, now(), now()),
  ('00000031-0000-4000-8000-000000000031', '00000021-0000-4000-8000-000000000021', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Vote B Video', '보컬', 120, 15, now(), now()),
  ('00000032-0000-4000-8000-000000000032', '00000022-0000-4000-8000-000000000022', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Vote C Video', '댄스', 80, 8, now(), now()),
  ('00000033-0000-4000-8000-000000000033', '00000023-0000-4000-8000-000000000023', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Vote D Video', '랩', 40, 4, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_scores (
  application_id, audition_id, vote_count, total_view_count, like_count,
  weighted_score, recommended_rank, recommended, updated_at
) VALUES
  ('00000021-0000-4000-8000-000000000021', '00000014-0000-4000-8000-000000000014', 5, 120, 15, 85.0, 1, true, now()),
  ('00000022-0000-4000-8000-000000000022', '00000014-0000-4000-8000-000000000014', 3, 80, 8, 70.0, 2, true, now()),
  ('00000023-0000-4000-8000-000000000023', '00000014-0000-4000-8000-000000000014', 1, 40, 4, 55.0, 3, false, now())
ON CONFLICT (application_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) Channel + public videos
-- ---------------------------------------------------------------------------
INSERT INTO public.channels (
  id, owner_id, name, description, profile_image_url, banner_image_url,
  subscriber_count, created_at, updated_at
) VALUES (
  '00000040-0000-4000-8000-000000000040',
  '00000005-0000-4000-8000-000000000005',
  '[DEV-QA] QA Dev Channel',
  'Development QA public channel for Native P2 E2E.',
  NULL, NULL, 0, now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.channel_videos (
  id, owner_id, channel_id, title, description, category, video_url, visibility,
  view_count, like_count, dislike_count, created_at, updated_at
) VALUES
  (
    '00000041-0000-4000-8000-000000000041',
    '00000005-0000-4000-8000-000000000005',
    '00000040-0000-4000-8000-000000000040',
    '[DEV-QA] Vocal Cover',
    'QA public video 1',
    'Vocal',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'PUBLIC', 50, 5, 0, now(), now()
  ),
  (
    '00000042-0000-4000-8000-000000000042',
    '00000005-0000-4000-8000-000000000005',
    '00000040-0000-4000-8000-000000000040',
    '[DEV-QA] Dance Practice',
    'QA public video 2',
    'Dance',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'PUBLIC', 30, 3, 0, now(), now()
  )
ON CONFLICT (id) DO NOTHING;

UPDATE public.users
SET featured_video_id = '00000041-0000-4000-8000-000000000041'::uuid,
    is_channel_public = true,
    intro_text = 'Development QA public channel owner.',
    updated_at = now()
WHERE id = '00000005-0000-4000-8000-000000000005'::uuid;

COMMIT;
