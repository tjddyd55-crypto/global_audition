-- =============================================================================
-- DEVELOPMENT ONLY — full QA dataset (extends seed-native-qa-develop.sql)
-- Idempotent: fixed UUIDs, ON CONFLICT DO NOTHING, credits only via unique
-- QA_SEED:<user> ledger rows (balance incremented together, never overwritten).
-- __QA_PW_HASH__ is replaced by build-dev-full-seed.py with a BCrypt hash read
-- from an untracked local secrets file. No plaintext password in this repo.
-- =============================================================================

-- Countries used by QA data
INSERT INTO public.countries (code, name, status, default_currency) VALUES
  ('KR','Korea','ACTIVE','KRW'), ('MN','Mongolia','ACTIVE','MNT'),
  ('JP','Japan','ACTIVE','JPY'), ('US','United States','ACTIVE','USD'),
  ('TH','Thailand','ACTIVE','THB')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Users: fixed accounts, country admins, 10 applicants, 4 extra agency users
-- UUID scheme: 0000a0xx-0000-4000-8000-0000000000xx
-- ---------------------------------------------------------------------------
INSERT INTO public.users (id, email, password_hash, role, nickname, username, display_name,
  account_status, signup_intent, country_code, nationality, is_channel_public, channel_categories, intro_text, created_at, updated_at)
SELECT v.id::uuid, v.email, '__QA_PW_HASH__', v.role, v.nick, v.nick, v.disp,
  'ACTIVE', v.intent, v.cc, v.cc, v.pub, v.cats, '[DEV-QA] test account', now(), now()
FROM (VALUES
  ('0000a001-0000-4000-8000-000000000001','admin@audition.local','SUPER_ADMIN','qa_admin','QA Super Admin','APPLICANT','KR',false,'{}'::text[]),
  ('0000a002-0000-4000-8000-000000000002','agency@audition.local','AGENCY','qa_agency','QA Agency Seoul','AGENCY','KR',false,'{}'::text[]),
  ('0000a003-0000-4000-8000-000000000003','user@audition.local','APPLICANT','qa_user','QA User','APPLICANT','KR',true,ARRAY['Vocal','Dance']),
  ('0000a011-0000-4000-8000-000000000011','qa-dev-ca-kr@audition.local','COUNTRY_ADMIN','qa_ca_kr','QA Country Admin KR','APPLICANT','KR',false,'{}'::text[]),
  ('0000a012-0000-4000-8000-000000000012','qa-dev-ca-mn@audition.local','COUNTRY_ADMIN','qa_ca_mn','QA Country Admin MN','APPLICANT','MN',false,'{}'::text[]),
  ('0000a013-0000-4000-8000-000000000013','qa-dev-ca-jp@audition.local','COUNTRY_ADMIN','qa_ca_jp','QA Country Admin JP','APPLICANT','JP',false,'{}'::text[]),
  ('0000a021-0000-4000-8000-000000000021','qa-dev-agency01@audition.local','AGENCY','qa_agency01','QA Agency Ulaanbaatar','AGENCY','MN',false,'{}'::text[]),
  ('0000a022-0000-4000-8000-000000000022','qa-dev-agency02@audition.local','AGENCY','qa_agency02','QA Agency Tokyo','AGENCY','JP',false,'{}'::text[]),
  ('0000a023-0000-4000-8000-000000000023','qa-dev-agency03@audition.local','APPLICANT','qa_agency03','QA Agency HQ Review','AGENCY','KR',false,'{}'::text[]),
  ('0000a024-0000-4000-8000-000000000024','qa-dev-agency04@audition.local','APPLICANT','qa_agency04','QA Agency Pending','AGENCY','US',false,'{}'::text[]),
  ('0000a031-0000-4000-8000-000000000031','qa-dev-app01@audition.local','APPLICANT','qa_app01','QA Applicant 01','APPLICANT','KR',false,'{}'::text[]),
  ('0000a032-0000-4000-8000-000000000032','qa-dev-app02@audition.local','APPLICANT','qa_app02','QA Applicant 02','APPLICANT','KR',false,'{}'::text[]),
  ('0000a033-0000-4000-8000-000000000033','qa-dev-app03@audition.local','APPLICANT','qa_app03','QA Applicant 03','APPLICANT','KR',false,'{}'::text[]),
  ('0000a034-0000-4000-8000-000000000034','qa-dev-app04@audition.local','APPLICANT','qa_app04','QA Applicant 04','APPLICANT','MN',false,'{}'::text[]),
  ('0000a035-0000-4000-8000-000000000035','qa-dev-app05@audition.local','APPLICANT','qa_app05','QA Applicant 05','APPLICANT','MN',false,'{}'::text[]),
  ('0000a036-0000-4000-8000-000000000036','qa-dev-app06@audition.local','APPLICANT','qa_app06','QA Applicant 06','APPLICANT','JP',false,'{}'::text[]),
  ('0000a037-0000-4000-8000-000000000037','qa-dev-app07@audition.local','APPLICANT','qa_app07','QA Applicant 07','APPLICANT','JP',false,'{}'::text[]),
  ('0000a038-0000-4000-8000-000000000038','qa-dev-app08@audition.local','APPLICANT','qa_app08','QA Applicant 08','APPLICANT','US',false,'{}'::text[]),
  ('0000a039-0000-4000-8000-000000000039','qa-dev-app09@audition.local','APPLICANT','qa_app09','QA Applicant 09 (no credits)','APPLICANT','KR',false,'{}'::text[]),
  ('0000a040-0000-4000-8000-000000000040','qa-dev-app10@audition.local','APPLICANT','qa_app10','QA Applicant 10 (dup-charge test)','APPLICANT','KR',false,'{}'::text[])
) AS v(id,email,role,nick,disp,intent,cc,pub,cats)
ON CONFLICT DO NOTHING;

-- Country admin appointments (one ACTIVE per country; skip if any active exists)
INSERT INTO public.country_admin_appointments (id, country_code, user_id, status, appointed_by)
SELECT v.id::uuid, v.cc, v.uid::uuid, 'ACTIVE', '0000a001-0000-4000-8000-000000000001'::uuid
FROM (VALUES
  ('0000b011-0000-4000-8000-000000000011','KR','0000a011-0000-4000-8000-000000000011'),
  ('0000b012-0000-4000-8000-000000000012','MN','0000a012-0000-4000-8000-000000000012'),
  ('0000b013-0000-4000-8000-000000000013','JP','0000a013-0000-4000-8000-000000000013')
) AS v(id,cc,uid)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5 agencies (CRM). APPROVED rows carry the HQ_REVIEW -> APPROVED event by the
-- super admin, matching AgencyApproval; linked users get AGENCY only if APPROVED.
-- ---------------------------------------------------------------------------
INSERT INTO public.crm_agencies (id, country_code, display_name, legal_name, contact_name, contact_email,
  website, stage, approval_state, linked_user_id, notes)
SELECT v.id::uuid, v.cc, v.name, v.name || ' Ltd. (DEV-QA)', 'QA Contact', v.email,
  NULL, v.stage, v.state, v.uid::uuid, '[DEV-QA] agency profile — development only'
FROM (VALUES
  ('0000c002-0000-4000-8000-000000000002','KR','[DEV-QA] QA Agency Seoul','agency@audition.local','ACTIVE','APPROVED','0000a002-0000-4000-8000-000000000002'),
  ('0000c021-0000-4000-8000-000000000021','MN','[DEV-QA] QA Agency Ulaanbaatar','qa-dev-agency01@audition.local','ACTIVE','APPROVED','0000a021-0000-4000-8000-000000000021'),
  ('0000c022-0000-4000-8000-000000000022','JP','[DEV-QA] QA Agency Tokyo','qa-dev-agency02@audition.local','ACTIVE','APPROVED','0000a022-0000-4000-8000-000000000022'),
  ('0000c023-0000-4000-8000-000000000023','KR','[DEV-QA] QA Agency HQ Review','qa-dev-agency03@audition.local','REVIEW','HQ_REVIEW','0000a023-0000-4000-8000-000000000023'),
  ('0000c024-0000-4000-8000-000000000024','US','[DEV-QA] QA Agency Pending','qa-dev-agency04@audition.local','LEAD','PENDING','0000a024-0000-4000-8000-000000000024')
) AS v(id,cc,name,email,stage,state,uid)
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_approval_events (id, crm_agency_id, from_state, to_state, action, actor_id, reason)
SELECT v.id::uuid, v.aid::uuid, v.f, v.t, v.a, v.actor::uuid, '[DEV-QA] seed'
FROM (VALUES
  ('0000d021-0000-4000-8000-000000000021','0000c002-0000-4000-8000-000000000002','PENDING','COUNTRY_REVIEW','SUBMIT','0000a002-0000-4000-8000-000000000002'),
  ('0000d022-0000-4000-8000-000000000022','0000c002-0000-4000-8000-000000000002','COUNTRY_REVIEW','HQ_REVIEW','RECOMMEND','0000a011-0000-4000-8000-000000000011'),
  ('0000d023-0000-4000-8000-000000000023','0000c002-0000-4000-8000-000000000002','HQ_REVIEW','APPROVED','HQ_APPROVE','0000a001-0000-4000-8000-000000000001'),
  ('0000d031-0000-4000-8000-000000000031','0000c021-0000-4000-8000-000000000021','PENDING','COUNTRY_REVIEW','SUBMIT','0000a021-0000-4000-8000-000000000021'),
  ('0000d032-0000-4000-8000-000000000032','0000c021-0000-4000-8000-000000000021','COUNTRY_REVIEW','HQ_REVIEW','RECOMMEND','0000a012-0000-4000-8000-000000000012'),
  ('0000d033-0000-4000-8000-000000000033','0000c021-0000-4000-8000-000000000021','HQ_REVIEW','APPROVED','HQ_APPROVE','0000a001-0000-4000-8000-000000000001'),
  ('0000d041-0000-4000-8000-000000000041','0000c022-0000-4000-8000-000000000022','PENDING','COUNTRY_REVIEW','SUBMIT','0000a022-0000-4000-8000-000000000022'),
  ('0000d042-0000-4000-8000-000000000042','0000c022-0000-4000-8000-000000000022','COUNTRY_REVIEW','HQ_REVIEW','RECOMMEND','0000a013-0000-4000-8000-000000000013'),
  ('0000d043-0000-4000-8000-000000000043','0000c022-0000-4000-8000-000000000022','HQ_REVIEW','APPROVED','HQ_APPROVE','0000a001-0000-4000-8000-000000000001'),
  ('0000d051-0000-4000-8000-000000000051','0000c023-0000-4000-8000-000000000023','PENDING','COUNTRY_REVIEW','SUBMIT','0000a023-0000-4000-8000-000000000023'),
  ('0000d052-0000-4000-8000-000000000052','0000c023-0000-4000-8000-000000000023','COUNTRY_REVIEW','HQ_REVIEW','RECOMMEND','0000a011-0000-4000-8000-000000000011')
) AS v(id,aid,f,t,a,actor)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 25 auditions: KR 10, MN 5, JP 5, other 5 (country_code OTHER; host US 3, TH 2)
-- state mix: open (OPEN, started), upcoming (OPEN, start in future), closed (CLOSED, past)
-- Thumbnails: static dev asset shipped by frontend/web/public (no R2).
-- ---------------------------------------------------------------------------
INSERT INTO public.auditions (id, owner_id, posting_branch_id, title, description, status, country_code, host_country,
  deadline_at, start_date, end_date, cover_image, image_original_url, image_medium_url, image_thumb_url,
  gallery_images, agency_name, agency_logo, applicants_count, remaining_days, recruit_fields, location,
  benefits, qualifications, schedules, process_mode, group_id, series_round, created_at, updated_at)
SELECT v.id::uuid, v.owner::uuid, v.branch::uuid,
  '[DEV-QA] ' || v.cc || ' ' || v.kind || ' Audition #' || v.n,
  'Development QA seed audition (' || v.kind || ', ' || v.cc || '). Not real.',
  CASE v.kind WHEN 'closed' THEN 'CLOSED' ELSE 'OPEN' END,
  -- recruit target uses the app's codes (KR/MN/JP/GLOBAL/OTHER); host_country keeps the ISO code
  CASE WHEN v.cc IN ('KR','MN','JP') THEN v.cc ELSE 'OTHER' END, v.cc,
  CASE v.kind WHEN 'closed' THEN now() - interval '3 days' WHEN 'upcoming' THEN now() + interval '45 days' ELSE now() + interval '20 days' END,
  CASE v.kind WHEN 'closed' THEN now() - interval '40 days' WHEN 'upcoming' THEN now() + interval '10 days' ELSE now() - interval '2 days' END,
  CASE v.kind WHEN 'closed' THEN now() - interval '3 days' WHEN 'upcoming' THEN now() + interval '45 days' ELSE now() + interval '20 days' END,
  '/audition-cover-placeholder.svg','/audition-cover-placeholder.svg','/audition-cover-placeholder.svg','/audition-cover-placeholder.svg',
  '{}', v.agency, '/avatar-default.svg', 0,
  CASE v.kind WHEN 'closed' THEN 0 WHEN 'upcoming' THEN 45 ELSE 20 END,
  ARRAY['Vocal','Dance'], v.loc, '{}', '{}', '{}', 'SINGLE', v.id::uuid, 1, now(), now()
FROM (VALUES
  ('0000e101-0000-4000-8000-000000000101','KR',1,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e102-0000-4000-8000-000000000102','KR',2,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e103-0000-4000-8000-000000000103','KR',3,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e104-0000-4000-8000-000000000104','KR',4,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Busan'),
  ('0000e105-0000-4000-8000-000000000105','KR',5,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Busan'),
  ('0000e106-0000-4000-8000-000000000106','KR',6,'upcoming','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e107-0000-4000-8000-000000000107','KR',7,'upcoming','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e108-0000-4000-8000-000000000108','KR',8,'closed','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e109-0000-4000-8000-000000000109','KR',9,'closed','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Incheon'),
  ('0000e110-0000-4000-8000-000000000110','KR',10,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Seoul'),
  ('0000e201-0000-4000-8000-000000000201','MN',1,'open','0000a021-0000-4000-8000-000000000021','0000c021-0000-4000-8000-000000000021','QA Agency Ulaanbaatar','Ulaanbaatar'),
  ('0000e202-0000-4000-8000-000000000202','MN',2,'open','0000a021-0000-4000-8000-000000000021','0000c021-0000-4000-8000-000000000021','QA Agency Ulaanbaatar','Ulaanbaatar'),
  ('0000e203-0000-4000-8000-000000000203','MN',3,'upcoming','0000a021-0000-4000-8000-000000000021','0000c021-0000-4000-8000-000000000021','QA Agency Ulaanbaatar','Ulaanbaatar'),
  ('0000e204-0000-4000-8000-000000000204','MN',4,'closed','0000a021-0000-4000-8000-000000000021','0000c021-0000-4000-8000-000000000021','QA Agency Ulaanbaatar','Darkhan'),
  ('0000e205-0000-4000-8000-000000000205','MN',5,'open','0000a021-0000-4000-8000-000000000021','0000c021-0000-4000-8000-000000000021','QA Agency Ulaanbaatar','Ulaanbaatar'),
  ('0000e301-0000-4000-8000-000000000301','JP',1,'open','0000a022-0000-4000-8000-000000000022','0000c022-0000-4000-8000-000000000022','QA Agency Tokyo','Tokyo'),
  ('0000e302-0000-4000-8000-000000000302','JP',2,'open','0000a022-0000-4000-8000-000000000022','0000c022-0000-4000-8000-000000000022','QA Agency Tokyo','Osaka'),
  ('0000e303-0000-4000-8000-000000000303','JP',3,'upcoming','0000a022-0000-4000-8000-000000000022','0000c022-0000-4000-8000-000000000022','QA Agency Tokyo','Tokyo'),
  ('0000e304-0000-4000-8000-000000000304','JP',4,'closed','0000a022-0000-4000-8000-000000000022','0000c022-0000-4000-8000-000000000022','QA Agency Tokyo','Tokyo'),
  ('0000e305-0000-4000-8000-000000000305','JP',5,'open','0000a022-0000-4000-8000-000000000022','0000c022-0000-4000-8000-000000000022','QA Agency Tokyo','Fukuoka'),
  ('0000e401-0000-4000-8000-000000000401','US',1,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Los Angeles'),
  ('0000e402-0000-4000-8000-000000000402','US',2,'upcoming','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','New York'),
  ('0000e403-0000-4000-8000-000000000403','US',3,'closed','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','New York'),
  ('0000e404-0000-4000-8000-000000000404','TH',1,'open','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Bangkok'),
  ('0000e405-0000-4000-8000-000000000405','TH',2,'closed','0000a002-0000-4000-8000-000000000002','0000c002-0000-4000-8000-000000000002','QA Agency Seoul','Bangkok')
) AS v(id,cc,n,kind,owner,branch,agency,loc)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Applications (seeded review states; no fee ledger — real charged applies are
-- done through the API during verification). Status coverage:
-- SUBMITTED, REVIEWING, ACCEPTED(PASSED), REJECTED(FAILED).
-- Duplicate-apply test: user@ already applied to e102 -> API re-apply must be 409.
-- ---------------------------------------------------------------------------
INSERT INTO public.applications (id, audition_id, applicant_id, status, vote_count, current_round_number,
  final_status, latest_result_status, applicant_name, video_url, nationality, created_at, updated_at)
SELECT v.id::uuid, v.aud::uuid, v.uid::uuid, v.st, 0, 1,
  CASE v.st WHEN 'ACCEPTED' THEN 'FINAL_PASSED' WHEN 'REJECTED' THEN 'FINAL_FAILED' ELSE 'IN_PROGRESS' END,
  CASE v.st WHEN 'ACCEPTED' THEN 'PASSED' WHEN 'REJECTED' THEN 'FAILED' ELSE 'PENDING' END,
  v.name, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', v.cc, now() - interval '1 day', now()
FROM (VALUES
  ('0000f001-0000-4000-8000-000000000001','0000e102-0000-4000-8000-000000000102','0000a003-0000-4000-8000-000000000003','SUBMITTED','QA User','KR'),
  ('0000f002-0000-4000-8000-000000000002','0000e108-0000-4000-8000-000000000108','0000a003-0000-4000-8000-000000000003','ACCEPTED','QA User','KR'),
  ('0000f003-0000-4000-8000-000000000003','0000e102-0000-4000-8000-000000000102','0000a031-0000-4000-8000-000000000031','SUBMITTED','QA Applicant 01','KR'),
  ('0000f004-0000-4000-8000-000000000004','0000e102-0000-4000-8000-000000000102','0000a032-0000-4000-8000-000000000032','REVIEWING','QA Applicant 02','KR'),
  ('0000f005-0000-4000-8000-000000000005','0000e103-0000-4000-8000-000000000103','0000a033-0000-4000-8000-000000000033','REVIEWING','QA Applicant 03','KR'),
  ('0000f006-0000-4000-8000-000000000006','0000e108-0000-4000-8000-000000000108','0000a031-0000-4000-8000-000000000031','ACCEPTED','QA Applicant 01','KR'),
  ('0000f007-0000-4000-8000-000000000007','0000e108-0000-4000-8000-000000000108','0000a032-0000-4000-8000-000000000032','REJECTED','QA Applicant 02','KR'),
  ('0000f008-0000-4000-8000-000000000008','0000e109-0000-4000-8000-000000000109','0000a033-0000-4000-8000-000000000033','REJECTED','QA Applicant 03','KR'),
  ('0000f009-0000-4000-8000-000000000009','0000e201-0000-4000-8000-000000000201','0000a034-0000-4000-8000-000000000034','SUBMITTED','QA Applicant 04','MN'),
  ('0000f010-0000-4000-8000-000000000010','0000e204-0000-4000-8000-000000000204','0000a035-0000-4000-8000-000000000035','ACCEPTED','QA Applicant 05','MN'),
  ('0000f011-0000-4000-8000-000000000011','0000e301-0000-4000-8000-000000000301','0000a036-0000-4000-8000-000000000036','REVIEWING','QA Applicant 06','JP'),
  ('0000f012-0000-4000-8000-000000000012','0000e304-0000-4000-8000-000000000304','0000a037-0000-4000-8000-000000000037','REJECTED','QA Applicant 07','JP'),
  ('0000f013-0000-4000-8000-000000000013','0000e401-0000-4000-8000-000000000401','0000a038-0000-4000-8000-000000000038','SUBMITTED','QA Applicant 08','US')
) AS v(id,aud,uid,st,name,cc)
ON CONFLICT DO NOTHING;

INSERT INTO public.application_videos (id, application_id, video_url, title, category, view_count, like_count, created_at, updated_at)
SELECT ('0000f1' || substr(a.id::text, 7))::uuid, a.id, a.video_url, '[DEV-QA] ' || a.applicant_name || ' video', 'Vocal', 0, 0, now(), now()
FROM public.applications a WHERE a.id::text LIKE '0000f0%'
ON CONFLICT DO NOTHING;

UPDATE public.auditions au SET applicants_count = c.n, updated_at = now()
FROM (SELECT audition_id, count(*)::int n FROM public.applications GROUP BY audition_id) c
WHERE au.id = c.audition_id AND au.id::text LIKE '0000e%' AND au.applicants_count IS DISTINCT FROM c.n;

-- ---------------------------------------------------------------------------
-- user@ channel + video metadata (My Studio / channel screens)
-- ---------------------------------------------------------------------------
INSERT INTO public.channels (id, owner_id, name, description, profile_image_url, banner_image_url, subscriber_count, created_at, updated_at)
VALUES ('0000a903-0000-4000-8000-000000000003','0000a003-0000-4000-8000-000000000003','[DEV-QA] QA User Channel',
  'Development QA channel for user@audition.local', '/avatar-default.svg', NULL, 0, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.channel_videos (id, owner_id, channel_id, title, description, category, video_url, visibility,
  view_count, like_count, dislike_count, created_at, updated_at)
SELECT v.id::uuid, '0000a003-0000-4000-8000-000000000003'::uuid, c.id, v.t, 'QA video metadata (dev only)', v.cat,
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'PUBLIC', 0, 0, 0, now(), now()
FROM (VALUES ('0000a913-0000-4000-8000-000000000013','[DEV-QA] User Vocal Cover','Vocal'),
             ('0000a923-0000-4000-8000-000000000023','[DEV-QA] User Dance Practice','Dance')) AS v(id,t,cat)
JOIN public.channels c ON c.owner_id = '0000a003-0000-4000-8000-000000000003'::uuid
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Credits: grant via unique QA_SEED:<user> ledger rows only.
-- app09 gets nothing (insufficient balance case); app10 gets 1 (dup-charge test).
-- ---------------------------------------------------------------------------
DO $credits$
DECLARE
  r record;
  cur bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('0000a003-0000-4000-8000-000000000003'::uuid, 20::bigint),
    ('0000a031-0000-4000-8000-000000000031'::uuid, 10::bigint), ('0000a032-0000-4000-8000-000000000032'::uuid, 10::bigint),
    ('0000a033-0000-4000-8000-000000000033'::uuid, 10::bigint), ('0000a034-0000-4000-8000-000000000034'::uuid, 10::bigint),
    ('0000a035-0000-4000-8000-000000000035'::uuid, 10::bigint), ('0000a036-0000-4000-8000-000000000036'::uuid, 10::bigint),
    ('0000a037-0000-4000-8000-000000000037'::uuid, 10::bigint), ('0000a038-0000-4000-8000-000000000038'::uuid, 10::bigint),
    ('0000a040-0000-4000-8000-000000000040'::uuid, 1::bigint)
  ) AS g(uid, amt) LOOP
    INSERT INTO public.user_credits (user_id, balance, updated_at) VALUES (r.uid, 0, now()) ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO cur FROM public.user_credits WHERE user_id = r.uid FOR UPDATE;
    IF NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = r.uid AND reference_id = 'QA_SEED:' || r.uid) THEN
      UPDATE public.user_credits SET balance = cur + r.amt, updated_at = now() WHERE user_id = r.uid;
      INSERT INTO public.credit_transactions (id, user_id, amount, type, reason, reference_id, note, before_balance, after_balance, created_at)
      VALUES (gen_random_uuid(), r.uid, r.amt, 'GRANT', 'QA_SEED', 'QA_SEED:' || r.uid,
              'DEV-QA seed grant (development only, free credits)', cur, cur + r.amt, now());
    END IF;
  END LOOP;
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  VALUES ('0000a039-0000-4000-8000-000000000039'::uuid, 0, now()) ON CONFLICT (user_id) DO NOTHING;
END
$credits$;
