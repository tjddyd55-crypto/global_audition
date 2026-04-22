// Re-export facade. Source of truth still lives at '@/lib/user/nicknameZod'.
// New PC/mobile UI code should import from '@/shared/*' to align with the layered architecture.
export * from '@/lib/user/nicknameZod'
