-- 개최 국가. 모집 대상(country_code)과 기획사 소속·매출 귀속 국가와 별개다.
-- 정산은 posting_branch 와 계약 국가를 그대로 본다. 이 컬럼은 정산 금액을 바꾸지 않는다.

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS host_country TEXT;

COMMENT ON COLUMN public.auditions.host_country IS
    '개최 국가 ISO2. 모집 대상 country_code, 기획사 지점 국가와 별개. 정산은 이 컬럼을 보지 않는다.';

-- Tokyo Open Call 테스트 행. location 이 Tokyo 이고 기존 country_code 가 문서화되지 않은 PH 인 경우만.
-- PH 는 개최국도 모집 대상 코드(KR/MN/GLOBAL/JP/OTHER)도 아니다. 운영 행을 조건 없이 고치지 않는다.
UPDATE public.auditions
SET host_country = 'JP',
    country_code = 'JP'
WHERE id = 'e5533082-7866-4112-9e44-39db846ed14a'
  AND title = 'Tokyo Open Call'
  AND location = 'Tokyo'
  AND country_code = 'PH';
