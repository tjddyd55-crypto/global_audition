-- 오디션 제안 테이블
CREATE TABLE IF NOT EXISTS audition_offers (
    id BIGSERIAL PRIMARY KEY,
    audition_id BIGINT NOT NULL,
    business_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    video_content_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    read_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_offer_audition FOREIGN KEY (audition_id) REFERENCES auditions(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_offers_user_id ON audition_offers(user_id);
CREATE INDEX idx_offers_business_id ON audition_offers(business_id);
CREATE INDEX idx_offers_audition_id ON audition_offers(audition_id);
CREATE INDEX idx_offers_status ON audition_offers(status);
CREATE INDEX idx_offers_video_content ON audition_offers(business_id, video_content_id);
