export const queryKeys = {
  me: ['auth', 'me'] as const,
  profile: ['me', 'profile'] as const,
  dashboard: ['me', 'dashboard'] as const,
  auditionsOpen: (country?: string) => ['auditions', 'open', country ?? 'GLOBAL'] as const,
  audition: (id: string) => ['auditions', id] as const,
  myAuditions: ['auditions', 'mine'] as const,
  myApplications: ['me', 'applications'] as const,
  myApplication: (id: string) => ['me', 'applications', id] as const,
  ranking: (auditionId: string) => ['auditions', auditionId, 'ranking'] as const,
  manage: (auditionId: string, status?: string) => ['agency', 'manage', auditionId, status ?? 'all'] as const,
  agencyDetail: (id: string) => ['agency', 'application', id] as const,
  roundEligibility: (applicationId: string, roundId: string) =>
    ['me', 'applications', applicationId, 'rounds', roundId, 'eligibility'] as const,
  creditPolicy: (policyKey: string) => ['credits', 'policy', policyKey] as const,
  creditBalance: ['credits', 'balance'] as const,
  votes: (auditionId: string, category?: string) =>
    ['auditions', auditionId, 'votes', category ?? 'all'] as const,
}
