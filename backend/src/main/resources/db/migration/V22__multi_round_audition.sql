SET search_path TO public;

-- =============================================================================
-- 다단계 라운드 오디션 (MULTI_ROUND) — 스키마 1단계
-- 기존 SINGLE: process_mode 기본값, 라운드 테이블 비어 있음 → 동작 동일
-- =============================================================================

-- ---------------------------------------------------------------------------
-- auditions 요약 필드
-- ---------------------------------------------------------------------------
ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS process_mode TEXT NOT NULL DEFAULT 'SINGLE';

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS current_round_number INT NULL;

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS max_round_number INT NULL;

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS selection_status TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'auditions_process_mode_chk'
  ) THEN
    ALTER TABLE public.auditions
      ADD CONSTRAINT auditions_process_mode_chk
      CHECK (process_mode IN ('SINGLE', 'MULTI_ROUND'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'auditions_selection_status_chk'
  ) THEN
    ALTER TABLE public.auditions
      ADD CONSTRAINT auditions_selection_status_chk
      CHECK (
        selection_status IS NULL
        OR selection_status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- audition_rounds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audition_rounds (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  round_name TEXT NOT NULL DEFAULT '',
  review_method TEXT NOT NULL,
  announcement_title TEXT NOT NULL DEFAULT '',
  announcement_body TEXT NOT NULL DEFAULT '',
  submission_label TEXT NOT NULL DEFAULT '',
  submission_guide TEXT NOT NULL DEFAULT '',
  required_submission_type TEXT NOT NULL DEFAULT 'VIDEO',
  start_at TIMESTAMPTZ NULL,
  end_at TIMESTAMPTZ NULL,
  result_announce_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audition_rounds_review_method_chk
    CHECK (review_method IN ('INTERNAL_REVIEW', 'PUBLIC_VOTE', 'FINAL_SELECTION')),
  CONSTRAINT audition_rounds_required_submission_type_chk
    CHECK (required_submission_type IN ('VIDEO', 'FILE', 'TEXT', 'MIXED')),
  CONSTRAINT uq_audition_rounds_audition_round_number UNIQUE (audition_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_audition_rounds_audition ON public.audition_rounds(audition_id);
CREATE INDEX IF NOT EXISTS idx_audition_rounds_audition_active ON public.audition_rounds(audition_id, is_active);

-- ---------------------------------------------------------------------------
-- applications — 라운드 진행 요약 (레거시 status 병행 유지)
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS current_round_number INT NOT NULL DEFAULT 1;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS final_status TEXT NOT NULL DEFAULT 'IN_PROGRESS';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS latest_result_status TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS latest_round_submission_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_final_status_chk'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_final_status_chk
      CHECK (final_status IN (
        'IN_PROGRESS', 'ELIMINATED', 'FINAL_PASSED', 'FINAL_FAILED', 'WITHDRAWN'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_latest_result_status_chk'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_latest_result_status_chk
      CHECK (latest_result_status IN ('PENDING', 'PASSED', 'FAILED'));
  END IF;
END $$;

-- FK는 application_round_submissions 생성 후
-- ---------------------------------------------------------------------------
-- application_round_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_round_submissions (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.audition_rounds(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  submission_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
  video_url TEXT NULL,
  file_url TEXT NULL,
  text_answer TEXT NULL,
  memo TEXT NULL,
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewer_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reviewer_note TEXT NULL,
  score DOUBLE PRECISION NULL,
  rank_order INT NULL,
  vote_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT application_round_submissions_status_chk
    CHECK (submission_status IN (
      'NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'PASSED', 'FAILED', 'SKIPPED'
    )),
  CONSTRAINT uq_application_round_submissions_app_round UNIQUE (application_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_ars_application ON public.application_round_submissions(application_id);
CREATE INDEX IF NOT EXISTS idx_ars_audition_round ON public.application_round_submissions(audition_id, round_number);
CREATE INDEX IF NOT EXISTS idx_ars_round ON public.application_round_submissions(round_id);

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_latest_round_submission_fk;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_latest_round_submission_fk
  FOREIGN KEY (latest_round_submission_id)
  REFERENCES public.application_round_submissions(id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- audition_round_result_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audition_round_result_logs (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.audition_rounds(id) ON DELETE CASCADE,
  previous_status TEXT NULL,
  next_status TEXT NULL,
  changed_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arrl_application ON public.audition_round_result_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_arrl_round ON public.audition_round_result_logs(round_id);

-- ---------------------------------------------------------------------------
-- audition_round_notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audition_round_notifications (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.audition_rounds(id) ON DELETE CASCADE,
  application_id UUID NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  target_email TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payload_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT arn_notification_type_chk
    CHECK (notification_type IN (
      'ROUND_OPEN', 'PASS_NOTICE', 'FAIL_NOTICE', 'FINAL_NOTICE'
    )),
  CONSTRAINT arn_channel_chk
    CHECK (channel IN ('EMAIL', 'IN_APP')),
  CONSTRAINT arn_status_chk
    CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_arn_audition_round ON public.audition_round_notifications(audition_id, round_id);

-- ---------------------------------------------------------------------------
-- votes — 라운드 제출물 연결 (NULL = 레거시 오디션 단일 투표)
-- ---------------------------------------------------------------------------
ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS round_id UUID NULL REFERENCES public.audition_rounds(id) ON DELETE SET NULL;

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS application_round_submission_id UUID NULL
  REFERENCES public.application_round_submissions(id) ON DELETE SET NULL;

ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS uq_votes_user_audition;

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_user_audition_legacy
  ON public.votes (user_id, audition_id)
  WHERE round_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_user_round
  ON public.votes (user_id, round_id)
  WHERE round_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_round ON public.votes(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_ars ON public.votes(application_round_submission_id);

-- ---------------------------------------------------------------------------
-- 레거시 데이터 정합성 (단일 라운드 의미)
-- ---------------------------------------------------------------------------
UPDATE public.applications
SET latest_result_status = CASE UPPER(TRIM(status))
    WHEN 'ACCEPTED' THEN 'PASSED'
    WHEN 'REJECTED' THEN 'FAILED'
    ELSE 'PENDING'
  END
WHERE latest_result_status = 'PENDING';

UPDATE public.applications
SET final_status = CASE UPPER(TRIM(status))
    WHEN 'REJECTED' THEN 'ELIMINATED'
    WHEN 'ACCEPTED' THEN 'FINAL_PASSED'
    ELSE 'IN_PROGRESS'
  END
WHERE final_status = 'IN_PROGRESS';
