-- 지원서 테이블
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    audition_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    result1 VARCHAR(20),
    result2 VARCHAR(20),
    result3 VARCHAR(20),
    final_result VARCHAR(20),
    video_id_1 BIGINT,
    video_id_2 BIGINT,
    payment_transaction_id VARCHAR(255),
    payment_amount DECIMAL(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_application_audition FOREIGN KEY (audition_id) REFERENCES auditions(id) ON DELETE CASCADE
);

-- 지원서 사진 테이블
CREATE TABLE IF NOT EXISTS application_photos (
    application_id BIGINT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    CONSTRAINT fk_application_photos FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_applications_audition_id ON applications(audition_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE UNIQUE INDEX idx_applications_user_audition ON applications(user_id, audition_id);
