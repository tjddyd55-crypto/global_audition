// Re-export facade. Source of truth still lives at '@/lib/auth/authStore'.
// New PC/mobile UI code should import from '@/shared/*' to align with the layered architecture.
export * from '@/lib/auth/authStore'
