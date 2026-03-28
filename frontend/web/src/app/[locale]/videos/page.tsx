import { unstable_noStore as noStore } from 'next/cache'
import { VideosBrowsePageClient } from '@/components/videos/VideosBrowsePageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function VideosPage() {
  noStore()
  return <VideosBrowsePageClient />
}
