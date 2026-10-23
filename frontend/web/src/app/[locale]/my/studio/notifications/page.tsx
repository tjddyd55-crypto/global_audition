'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { studioApi } from '@/shared/api/studio'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioNotificationsPage() {
  const t = useTranslations('studio')
  const tNotice = useTranslations('notifications')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['studio', 'notifications'], queryFn: studioApi.notifications })
  const markRead = useMutation({
    mutationFn: (id: string) => studioApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['studio', 'notifications'] })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('notifications')}</h2>
      <p className={TEXT_SUB}>{t('notificationsHint')}</p>
      {query.isLoading ? <p className={TEXT_SUB}>{t('loginRequired')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{tNotice('loadFailed')}</p> : null}
      {query.data && query.data.length === 0 ? <p className={TEXT_SUB}>{tNotice('empty')}</p> : null}
      <ul className="flex flex-col gap-2">
        {(query.data ?? []).map((item) => (
          <li key={item.id} className="rounded-lg border border-neutral-200 p-3">
            <div className="font-medium text-gray-900">{item.title || item.type}</div>
            <p className={`mt-1 ${TEXT_SUB}`}>{item.body}</p>
            <div className={`mt-2 ${TEXT_SUB}`}>
              {item.type} · {item.status}
              {item.readAt ? ` · ${t('read')}` : ''}
              {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString(locale)}` : ''}
            </div>
            {!item.readAt ? (
              <button
                type="button"
                className="mt-2 text-sm font-medium underline"
                onClick={() => markRead.mutate(item.id)}
              >
                {t('markRead')}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
