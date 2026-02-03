-- 국제화를 위한 필드 추가

-- 지망생 프로필에 국제화 필드 추가
ALTER TABLE applicant_profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(2), -- ISO 3166-1 alpha-2 코드 (KR, US, JP 등)
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50), -- 국가별 형식 다름
ADD COLUMN IF NOT EXISTS address TEXT, -- 선택적
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50), -- 예: Asia/Seoul, America/New_York
ADD COLUMN IF NOT EXISTS languages VARCHAR(500); -- 쉼표로 구분된 언어 코드 (ko, en, ja 등)

-- 기획사 프로필에 국제화 및 사업자 정보 필드 추가
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(2), -- ISO 3166-1 alpha-2 코드
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255), -- 공식 법인명
ADD COLUMN IF NOT EXISTS representative_name VARCHAR(255), -- 대표자명
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100), -- 국가별 형식 다름
ADD COLUMN IF NOT EXISTS business_license_document_url VARCHAR(500), -- 사업자 등록증 파일 URL
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100), -- 국가별 세금 ID (EIN, VAT 등)
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP, -- 검증 완료 일시
ADD COLUMN IF NOT EXISTS verification_notes TEXT; -- 검증 메모

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_applicant_country ON applicant_profiles(country);
CREATE INDEX IF NOT EXISTS idx_applicant_city ON applicant_profiles(city);
CREATE INDEX IF NOT EXISTS idx_business_country ON business_profiles(country);
CREATE INDEX IF NOT EXISTS idx_business_verification_status ON business_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_business_registration_number ON business_profiles(business_registration_number);

-- 기존 nationality 필드를 country로 마이그레이션 (선택적)
-- UPDATE applicant_profiles SET country = UPPER(nationality) WHERE nationality IS NOT NULL AND country IS NULL;
