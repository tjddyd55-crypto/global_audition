-- V6: Create comment_likes table (댓글 좋아요)
-- 작업: 2026_21_community_features

CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id),
    CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES video_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
