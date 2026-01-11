-- ADMIN user_type 추가는 이미 ENUM으로 지원되므로 별도 마이그레이션 불필요
-- 단, 기존 데이터는 유지하고 새로운 ADMIN 타입 사용 가능

-- 관리자 계정 예시 (실제 환경에서는 수동으로 생성)
-- INSERT INTO users (email, password, name, user_type, provider, created_at)
-- VALUES ('admin@example.com', 'encoded_password', '관리자', 'ADMIN', 'LOCAL', CURRENT_TIMESTAMP)
-- ON CONFLICT (email) DO NOTHING;
