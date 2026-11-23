'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { studioApi, type NotificationSettings } from '@/shared/api/studio'
import { notificationBadge, notificationCopy, notificationLink } from '@/shared/studio/notificationCopy'
import { Link } from '@/i18n.config'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioNotificationsPage() {
  const t = useTranslations('studio')
  const tNotice = useTranslations('notifications')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['studio', 'notifications'], queryFn: studioApi.notifications })
  const settingsQuery = useQuery({ queryKey: ['studio', 'notification-settings'], queryFn: studioApi.notificationSettings })
  const saveSettings = useMutation({
    mutationFn: (body: NotificationSettings) => studioApi.updateNotificationSettings(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['studio', 'notification-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['studio', 'notifications'] })
    },
  })
  const markRead = useMutation({
    mutationFn: (id: string) => studioApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['studio', 'notifications'] })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('notifications')}</h2>
      <p className={TEXT_SUB} data-testid="unread-count">
        {t('unreadCount', { count: (query.data ?? []).filter((item) => !item.readAt).length })}
      </p>
      <p className={TEXT_SUB}>{t('notificationsHint')}</p>

      <NotificationSettingsPanel
        value={settingsQuery.data}
        disabled={settingsQuery.isLoading || saveSettings.isPending}
        onChange={(next) => saveSettings.mutate(next)}
      />
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{tNotice('loadFailed')}</p> : null}
      {query.data && query.data.length === 0 ? <p className={TEXT_SUB}>{tNotice('empty')}</p> : null}
      <ul className="flex flex-col gap-2">
        {(query.data ?? []).map((item) => {
          const copy = notificationCopy(item, (key, params) => tNotice(key, params))
          const href = notificationLink(item)
          return (
          <li key={item.id} className="rounded-lg border border-neutral-200 p-3">
            <div className="font-medium text-gray-900">{copy.title}</div>
            <p className={`mt-1 ${TEXT_SUB}`}>{copy.body}</p>
            <div className={`mt-2 ${TEXT_SUB}`}>
              {[
                notificationBadge(item, (key) => tNotice(key)),
                item.readAt ? t('read') : '',
                item.createdAt ? new Date(item.createdAt).toLocaleString(locale) : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {href ? (
              <Link
                href={href}
                className="mt-2 mr-3 inline-block text-sm font-medium text-violet-700 underline"
                onClick={() => {
                  if (!item.readAt) markRead.mutate(item.id)
                }}
              >
                {tNotice('open')}
              </Link>
            ) : null}
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
          )
        })}
      </ul>
    </div>
  )
}

function NotificationSettingsPanel({
  value,
  disabled,
  onChange,
}: {
  value?: NotificationSettings
  disabled: boolean
  onChange: (next: NotificationSettings) => void
}) {
  const tNotice = useTranslations('notifications')
  const current: NotificationSettings = value ?? { savedDeadline: true, newMatch: true, results: true, offers: true }
  const rows: Array<{ key: keyof NotificationSettings; label: string }> = [
    { key: 'savedDeadline', label: tNotice('savedDeadlineToggle') },
    { key: 'newMatch', label: tNotice('newMatchToggle') },
    { key: 'results', label: tNotice('resultsToggle') },
    { key: 'offers', label: tNotice('offersToggle') },
  ]
  return (
    <section className="rounded-lg border border-neutral-200 p-3" data-testid="notification-settings">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">{tNotice('settingsTitle')}</h3>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <label key={row.key} className="flex items-start gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={current[row.key]}
              disabled={disabled}
              onChange={(event) => onChange({ ...current, [row.key]: event.target.checked })}
            />
            <span className="min-w-0 break-words leading-5">{row.label}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
