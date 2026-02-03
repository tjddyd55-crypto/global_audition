-- 비디오 콘텐츠 테이블 (Media Service와 공유)
CREATE TABLE IF NOT EXISTS video_contents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER, -- 초 단위
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    category VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED', -- PUBLISHED, PRIVATE, DELETED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_video_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_videos_user_id ON video_contents(user_id);
CREATE INDEX idx_videos_category ON video_contents(category);
CREATE INDEX idx_videos_status ON video_contents(status);
CREATE INDEX idx_videos_created ON video_contents(created_at DESC);
