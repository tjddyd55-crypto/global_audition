-- 캄보디아(KH)·우즈베키스탄(UZ)을 가입·거주 국가로 고를 수 있게 countries 행을 넣는다.
-- 이미 있는 행은 그대로 둔다(ON CONFLICT DO NOTHING). 기존 데이터를 바꾸거나 지우지 않는다.
-- 국가 관리자 임명, 계약, 수익 배분율, 정산 기록은 만들지 않는다. 국가 관리자 승인은 본사 최종 승인 정책을 따른다.
-- 국가 코드(KH, UZ)는 UI·콘텐츠 언어 코드(km, uz)와 다른 값이다.
INSERT INTO public.countries (code, name, status, default_currency) VALUES
    ('KH', 'Cambodia', 'ACTIVE', 'KHR'),
    ('UZ', 'Uzbekistan', 'ACTIVE', 'UZS')
ON CONFLICT (code) DO NOTHING;
