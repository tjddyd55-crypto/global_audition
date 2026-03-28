import { unstable_noStore as noStore } from 'next/cache'
import { VideoDetailPageClient } from '@/components/video/VideoDetailPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function VideoApplicationDetailPage() {
  noStore()
  return <VideoDetailPageClient />
}
