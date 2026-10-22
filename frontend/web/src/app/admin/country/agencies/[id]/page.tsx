'use client'

import { useParams } from 'next/navigation'
import { AgenciesScreen } from '../../kit'

export default function AgencyDetailPage() {
  const params = useParams<{ id: string }>()
  return <AgenciesScreen detailId={params.id} />
}
