-- 공고별 회차 투표(랭킹) 설정. 공고 등록·수정 시 기획사가 정한다.
-- voting_rounds IS NULL = 기존 동작 유지(모든 회차 투표 가능). 기존 공고·투표 데이터는 바꾸지 않는다.
-- voting_rounds = '{}' 은 투표 없음, '{3}' 은 3차만, '{1,2,3}' 은 모든 회차.
-- 회차 번호: MULTI_ROUND 는 current_round_number, 그 외는 series_round(시리즈 차수).
ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS voting_round_count INT,
    ADD COLUMN IF NOT EXISTS voting_rounds INT[];

ALTER TABLE public.auditions
    DROP CONSTRAINT IF EXISTS auditions_voting_round_count_range;
ALTER TABLE public.auditions
    ADD CONSTRAINT auditions_voting_round_count_range
        CHECK (voting_round_count IS NULL OR (voting_round_count BETWEEN 1 AND 10));

COMMENT ON COLUMN public.auditions.voting_round_count IS
    '공고 등록 시 계획한 총 회차 수(1~10). 투표 설정 화면 표시용. NULL = 미설정.';
COMMENT ON COLUMN public.auditions.voting_rounds IS
    '투표·랭킹을 쓰는 회차 번호 목록. NULL = 기존 동작(모든 회차 투표), 빈 배열 = 투표 없음.';
