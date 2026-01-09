-- 전체 스키마 생성 스크립트
-- 이 파일은 개발 환경에서 전체 스키마를 한 번에 생성할 때 사용합니다

\c audition_db;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 오디션 테이블
CREATE TABLE IF NOT EXISTS auditions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    requirements TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    screening_date_1 DATE,
    announcement_date_1 DATE,
    screening_date_2 DATE,
    announcement_date_2 DATE,
    screening_date_3 DATE,
    announcement_date_3 DATE,
    banner_url VARCHAR(500),
    business_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_audition_business FOREIGN KEY (business_id) REFERENCES users(id)
);

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
    CONSTRAINT fk_application_audition FOREIGN KEY (audition_id) REFERENCES auditions(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 지원서 사진 테이블
CREATE TABLE IF NOT EXISTS application_photos (
    application_id BIGINT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    CONSTRAINT fk_application_photos FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

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
    CONSTRAINT fk_offer_audition FOREIGN KEY (audition_id) REFERENCES auditions(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_business FOREIGN KEY (business_id) REFERENCES users(id),
    CONSTRAINT fk_offer_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 비디오 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS video_contents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    category VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_video_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_auditions_status ON auditions(status);
CREATE INDEX IF NOT EXISTS idx_auditions_category ON auditions(category);
CREATE INDEX IF NOT EXISTS idx_auditions_business_id ON auditions(business_id);
CREATE INDEX IF NOT EXISTS idx_applications_audition_id ON applications(audition_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON audition_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_business_id ON audition_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON video_contents(user_id);
