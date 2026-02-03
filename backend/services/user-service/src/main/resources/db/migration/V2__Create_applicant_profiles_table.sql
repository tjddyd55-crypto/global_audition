-- 지망생 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS applicant_profiles (
    user_id BIGINT PRIMARY KEY,
    stage_name VARCHAR(255),
    bio TEXT,
    banner_url VARCHAR(500),
    nationality VARCHAR(50), -- 하위 호환성 유지
    gender VARCHAR(20),
    birthday DATE,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    youtube_url VARCHAR(500),
    instagram_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_applicant_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
