import { redirect } from '@/i18n.config'

export default async function SuperAdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect({ href: '/admin/super/credit-policies', locale })
}
