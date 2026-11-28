'use client'

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { useTranslations } from 'next-intl'

type FrameProps = ComponentPropsWithoutRef<'iframe'> & { src: string }

export function EmbeddedVideoFrame(props: FrameProps) {
  if (!props.src.startsWith('https://player.bilibili.com/player.html?')) return <iframe {...props} />
  return <BilibiliFrame key={props.src} {...props} />
}

function BilibiliFrame({ className, onLoad, ...props }: FrameProps) {
  const t = useTranslations('video')
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!box.current || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
      if (!entry.isIntersecting) setLoaded(false)
    })
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className={className?.includes('absolute') ? className : `relative ${className ?? ''}`} style={props.style}>
      {visible && !failed ? (
        <iframe {...props} className="block h-full w-full border-0" style={undefined}
          onLoad={(event) => { setLoaded(true); onLoad?.(event) }} onError={() => setFailed(true)} />
      ) : null}
      {visible && !loaded ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-white pointer-events-none">
          {failed ? (
            <button className="pointer-events-auto rounded bg-black/80 px-3 py-2" type="button" onClick={() => setFailed(false)}>
              {t('cannotEmbed')} · {t('retry')}
            </button>
          ) : <span className="rounded bg-black/80 px-3 py-2" role="status">{t('preparing')}</span>}
        </div>
      ) : null}
    </div>
  )
}
