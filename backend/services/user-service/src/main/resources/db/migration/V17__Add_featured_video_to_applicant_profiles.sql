-- V17: Add featured video to applicant_profiles (MVP_02_creator_channel)
-- 대표영상 설정 기능 추가

ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS featured_video_id BIGINT NULL;

COMMENT ON COLUMN applicant_profiles.featured_video_id IS '대표영상 ID (Media Service의 video_contents.id 참조)';
