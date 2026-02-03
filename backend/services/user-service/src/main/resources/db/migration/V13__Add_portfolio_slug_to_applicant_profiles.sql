-- V13: Add portfolio_slug to applicant_profiles (포트폴리오 공개 링크)
-- 작업: 2026_18_portfolio_builder

ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS portfolio_slug VARCHAR(100) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_applicant_profiles_portfolio_slug ON applicant_profiles(portfolio_slug);
