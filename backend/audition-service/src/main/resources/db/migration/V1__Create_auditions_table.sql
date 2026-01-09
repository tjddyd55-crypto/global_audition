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
    updated_at TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_auditions_status ON auditions(status);
CREATE INDEX idx_auditions_category ON auditions(category);
CREATE INDEX idx_auditions_business_id ON auditions(business_id);
CREATE INDEX idx_auditions_dates ON auditions(start_date, end_date);
