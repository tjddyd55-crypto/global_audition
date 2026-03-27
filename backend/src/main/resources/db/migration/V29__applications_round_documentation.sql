SET search_path TO public;

-- 차수 SSOT: applications.current_round_number (API·프론트 JSON 필드명 round)
COMMENT ON COLUMN applications.current_round_number IS '지원서 현재 차수(1=1차). 신규 컬럼 round 추가 없이 본 컬럼을 사용합니다.';
