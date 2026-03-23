import { redirect } from 'next/navigation'

/**
 * 예전 로케일 접두 URL(`/ko/admin/super/...`) → `/admin/super/...` 로 통일
 */
export default async function LegacySuperAdminLocaleRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}) {
  const { slug } = await params
  const suffix = slug?.length ? `/${slug.join('/')}` : ''
  redirect(`/admin/super${suffix}`)
}
