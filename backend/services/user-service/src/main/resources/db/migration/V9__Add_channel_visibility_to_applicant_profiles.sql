-- V9: Add channel visibility to applicant_profiles

ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS channel_visibility VARCHAR(20) DEFAULT 'PUBLIC';

UPDATE applicant_profiles
SET channel_visibility = 'PUBLIC'
WHERE channel_visibility IS NULL;

