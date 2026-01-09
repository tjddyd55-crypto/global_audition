-- 사용자 테이블 (User Service와 공유)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- APPLICANT, BUSINESS
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 사용자 프로필 테이블 (지망생)
CREATE TABLE IF NOT EXISTS applicant_profiles (
    user_id BIGINT PRIMARY KEY,
    stage_name VARCHAR(255),
    bio TEXT,
    banner_url VARCHAR(500),
    nationality VARCHAR(100),
    gender VARCHAR(20),
    birthday DATE,
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    youtube_url VARCHAR(500),
    instagram_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_applicant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 기획사 프로필 테이블
CREATE TABLE IF NOT EXISTS business_profiles (
    user_id BIGINT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    description TEXT,
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    established_year INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_deleted ON users(deleted_at);
