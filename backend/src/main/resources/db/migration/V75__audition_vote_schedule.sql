-- 공개 투표는 기획사가 후보를 확정하고 시작·종료 시각을 정한 뒤에만 열린다.
-- 기존 공고·투표 행은 바꾸지 않는다. vote_started_at 이 비어 있으면 아직 시작하지 않은 것이다.

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS vote_start_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS vote_end_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS vote_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS vote_round_number INT;

ALTER TABLE public.auditions
    DROP CONSTRAINT IF EXISTS auditions_vote_window_order;
ALTER TABLE public.auditions
    ADD CONSTRAINT auditions_vote_window_order
        CHECK (vote_start_at IS NULL OR vote_end_at IS NULL OR vote_end_at > vote_start_at);

COMMENT ON COLUMN public.auditions.vote_start_at IS '공개 투표 시작 시각(서버 UTC). 예약이면 이 시각 이전에는 투표할 수 없다.';
COMMENT ON COLUMN public.auditions.vote_end_at IS '공개 투표 종료 시각(서버 UTC). 이 시각부터는 자동으로 닫힌다.';
COMMENT ON COLUMN public.auditions.vote_started_at IS '기획사가 투표 시작을 확정한 시각. NULL 이면 공개 투표 목록에 나오지 않는다.';
COMMENT ON COLUMN public.auditions.vote_round_number IS '현재 시작된 공개 투표의 회차 번호.';

CREATE TABLE IF NOT EXISTS public.audition_vote_candidates (
    audition_id UUID NOT NULL REFERENCES public.auditions (id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    application_id UUID NOT NULL REFERENCES public.applications (id),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (audition_id, round_number, application_id)
);

CREATE INDEX IF NOT EXISTS audition_vote_candidates_app
    ON public.audition_vote_candidates (application_id);

COMMENT ON TABLE public.audition_vote_candidates IS
    '투표 시작 시 확정된 후보. 시작 이후에는 바꾸지 않는다.';
