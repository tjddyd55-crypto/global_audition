-- 소셜 로그인 필드 추가
ALTER TABLE users
    ADD COLUMN provider VARCHAR(20), -- LOCAL, GOOGLE, KAKAO, NAVER
    ADD COLUMN provider_id VARCHAR(255); -- 소셜 로그인 제공자의 사용자 ID

-- provider와 provider_id로 조회를 위한 인덱스
CREATE INDEX idx_users_provider_provider_id ON users(provider, provider_id);
