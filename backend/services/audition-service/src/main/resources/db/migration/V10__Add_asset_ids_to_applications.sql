-- V10: Add asset_ids to applications (Creative Vault integration)
-- 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION

-- application_attachments 테이블 생성 (asset_id 참조)
CREATE TABLE IF NOT EXISTS application_attachments (
    application_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (application_id, asset_id),
    CONSTRAINT fk_application_attachments_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_application_attachments_application ON application_attachments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_attachments_asset ON application_attachments(asset_id);
