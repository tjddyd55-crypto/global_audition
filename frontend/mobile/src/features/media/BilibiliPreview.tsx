import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { bilibiliLink } from '../../../../web/src/shared/audition/bilibili'
import { apiRequest } from '../../api/http'
import { Button } from '../../ui/Button'
import { NativeVideoPlayer } from './NativeVideoPlayer'

export function BilibiliPreview({ value }: { value: string }) {
  const link = bilibiliLink(value)
  return link ? <Preview key={link.url} url={link.url} /> : null
}

function Preview({ url }: { url: string }) {
  const { t } = useTranslation()
  const [resolved, setResolved] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Text>{t('video.bilibiliDetected')} · {t('video.bilibiliPublic')}</Text>
      {resolved ? <NativeVideoPlayer videoUrl={resolved} /> : (
        <Button variant="secondary" label={t('video.tryPreview')} loading={busy} onPress={async () => {
          setBusy(true)
          setFailed(false)
          try {
            const direct = bilibiliLink(url)
            const result = direct?.kind === 'video' ? direct
              : await apiRequest<{ url: string }>('/me/video-links/resolve', { method: 'POST', body: { url } })
            setResolved(result.url)
          } catch {
            setFailed(true)
          } finally {
            setBusy(false)
          }
        }} />
      )}
      {failed ? <Text accessibilityRole="alert">{t('video.shortUnavailable')}</Text> : null}
    </View>
  )
}
