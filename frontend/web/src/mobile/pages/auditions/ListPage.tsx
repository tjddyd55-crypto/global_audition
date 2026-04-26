'use client'

import AuditionList from '@/components/audition/AuditionList'
import AuditionsPageHeader from '@/components/audition/AuditionsPageHeader'

export default function MobileAuditionsListPage() {
  return (
    <div className="min-h-screen w-full pt-8 pb-8">
      <AuditionsPageHeader
        title="오디션 목록"
        titleClassName="mb-8 text-3xl font-bold md:text-4xl"
      />
      <AuditionList />
    </div>
  )
}
