-- ---------------------------------------------------------------------------
-- 초기 슈퍼관리자 계정 (개발·스테이징용 시드)
-- 이메일: superadmin@audition.local
-- 비밀번호: SuperAdmin!ChangeMe
-- 프로덕션: 배포 후 즉시 비밀번호 변경 또는 계정 삭제 후 별도 절차로 생성할 것.
-- ---------------------------------------------------------------------------
INSERT INTO public.users (
    id,
    email,
    password_hash,
    role,
    username,
    display_name,
    created_at,
    updated_at
)
SELECT
    'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid,
    'superadmin@audition.local',
    '$2b$10$pP5ZBt/NB4bQflGYBzwP1uM81NbxHBh7pYZWcEABFKZAU5RqjYsXC',
    'SUPER_ADMIN',
    'superadmin_system',
    'Super Admin',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE lower(u.email) = lower('superadmin@audition.local')
)
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.username = 'superadmin_system'
);
