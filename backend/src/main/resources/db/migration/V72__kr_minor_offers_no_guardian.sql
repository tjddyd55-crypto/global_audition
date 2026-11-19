-- 한국: 만 14세 이상 미성년자는 보호자 확인 없이 캐스팅 제안 수신 가능(본인 설정). 만 14세 미만은 기존대로 보호자 확인 필요.
-- 연락처 공유·외부 연락 차단(minor_contact_sharing_allowed=false)은 그대로 유지.
UPDATE country_minor_policies
SET minor_offers_require_guardian = FALSE,
    note = '한국 초기 기준: 성년 19세, 개인정보 보호자 동의 14세 미만. 14세 이상은 보호자 확인 없이 제안 수신(연락처 공유 차단 유지).',
    updated_at = NOW()
WHERE country_code = 'KR';

-- 한국 외 국가 값은 미확정(법무 검토 전) 임을 메모에 명시한다. 값 자체는 바꾸지 않는다.
UPDATE country_minor_policies
SET note = '미확정(정식 출시 전 법무 검토 필요): ' || COALESCE(note, '')
WHERE country_code <> 'KR' AND COALESCE(note, '') NOT LIKE '미확정%';
