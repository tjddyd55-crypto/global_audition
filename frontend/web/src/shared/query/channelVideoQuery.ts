// Re-export facade. Source of truth still lives at '@/lib/query/channelVideoQuery'.
// New PC/mobile UI code should import from '@/shared/*' to align with the layered architecture.
export * from '@/lib/query/channelVideoQuery'
