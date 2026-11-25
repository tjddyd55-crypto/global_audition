-- Applicant list numbers and public ballot numbers are separate identities.
-- Existing candidates/votes remain intact. Historic rows receive deterministic initial numbers.
CREATE TABLE public.audition_applicant_number_counters (
    audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number >= 0),
    last_number INT NOT NULL CHECK (last_number > 0),
    PRIMARY KEY (audition_id, round_number)
);
CREATE TABLE public.application_entry_numbers (
    audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number >= 0),
    entry_number INT NOT NULL CHECK (entry_number > 0),
    PRIMARY KEY (application_id, round_number),
    UNIQUE (audition_id, round_number, entry_number)
);
COMMENT ON COLUMN public.application_entry_numbers.round_number IS '0=전체 지원자; 1 이상=해당 심사 차수. 투표 번호와 별개.';

WITH memberships AS (
    SELECT id AS application_id, audition_id, 0 AS round_number, created_at AS entered_at FROM public.applications
    UNION ALL
    SELECT id, audition_id, GREATEST(COALESCE(current_round_number, 1), 1), created_at FROM public.applications
    UNION ALL
    SELECT application_id, audition_id, round_number, created_at FROM public.application_round_submissions
), distinct_memberships AS (
    SELECT application_id, audition_id, round_number, MIN(entered_at) AS entered_at
    FROM memberships GROUP BY application_id, audition_id, round_number
)
INSERT INTO public.application_entry_numbers(audition_id, application_id, round_number, entry_number)
SELECT audition_id, application_id, round_number,
       ROW_NUMBER() OVER (PARTITION BY audition_id, round_number ORDER BY entered_at, application_id)::INT
FROM distinct_memberships;
INSERT INTO public.audition_applicant_number_counters(audition_id, round_number, last_number)
SELECT audition_id, round_number, MAX(entry_number) FROM public.application_entry_numbers GROUP BY audition_id, round_number;

CREATE FUNCTION public.assign_application_entry_number(aud UUID, app UUID, scope_round INT) RETURNS VOID AS $$
DECLARE allocated INT;
BEGIN
    -- Serialize assignments for one audition, including concurrent batch advancement/submissions.
    PERFORM pg_advisory_xact_lock(hashtextextended(aud::TEXT, 76));
    IF EXISTS (SELECT 1 FROM public.application_entry_numbers WHERE application_id = app AND round_number = scope_round) THEN
        RETURN;
    END IF;
    INSERT INTO public.audition_applicant_number_counters(audition_id, round_number, last_number)
    VALUES (aud, scope_round, 1)
    ON CONFLICT (audition_id, round_number) DO UPDATE
       SET last_number = public.audition_applicant_number_counters.last_number + 1
    RETURNING last_number INTO allocated;
    INSERT INTO public.application_entry_numbers(audition_id, application_id, round_number, entry_number)
    VALUES (aud, app, scope_round, allocated);
END;
$$ LANGUAGE plpgsql;
CREATE FUNCTION public.assign_application_entry_numbers_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.assign_application_entry_number(NEW.audition_id, NEW.id, 0);
    PERFORM public.assign_application_entry_number(NEW.audition_id, NEW.id, GREATEST(COALESCE(NEW.current_round_number, 1), 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER applications_assign_entry_numbers
AFTER INSERT OR UPDATE OF current_round_number ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.assign_application_entry_numbers_trigger();
CREATE FUNCTION public.assign_round_submission_entry_number_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.assign_application_entry_number(NEW.audition_id, NEW.application_id, NEW.round_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER application_round_submissions_assign_entry_number
AFTER INSERT ON public.application_round_submissions
FOR EACH ROW EXECUTE FUNCTION public.assign_round_submission_entry_number_trigger();

ALTER TABLE public.audition_vote_candidates ADD COLUMN candidate_number INT;
WITH numbered AS (
    SELECT audition_id, round_number, application_id,
           ROW_NUMBER() OVER (PARTITION BY audition_id, round_number ORDER BY confirmed_at, application_id)::INT AS n
    FROM public.audition_vote_candidates
)
UPDATE public.audition_vote_candidates c SET candidate_number = n.n FROM numbered n
WHERE c.audition_id = n.audition_id AND c.round_number = n.round_number AND c.application_id = n.application_id;
ALTER TABLE public.audition_vote_candidates ALTER COLUMN candidate_number SET NOT NULL;
ALTER TABLE public.audition_vote_candidates ADD CONSTRAINT vote_candidate_number_positive CHECK (candidate_number > 0);
CREATE UNIQUE INDEX ux_vote_candidate_number ON public.audition_vote_candidates(audition_id, round_number, candidate_number);
COMMENT ON COLUMN public.audition_vote_candidates.candidate_number IS '해당 회차 투표 시작 때 1부터 새로 부여한 고정 투표 번호. 지원자 번호/순위와 별개.';
