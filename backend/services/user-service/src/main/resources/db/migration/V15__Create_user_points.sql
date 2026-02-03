-- V15: Create user_points table (포인트 시스템)
-- 작업: POINTS_01_system_design, POINTS_02_backend_points

CREATE TABLE IF NOT EXISTS user_points (
    user_id BIGINT PRIMARY KEY,
    balance BIGINT NOT NULL DEFAULT 0, -- 포인트 잔액
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_user_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_points_balance ON user_points(balance);
