'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { facebookShareUrl, INSTAGRAM_WEB_URL, shareMessage } from '@/shared/vote/voteShare'

type Props = {
  open: boolean
  onClose: () => void
  url: string
  title: string
  defaultText: string
  /** 지원자 본인 공유처럼 문구를 고칠 수 있게 할 때 */
  editable?: boolean
  /** 공유 창 위쪽 안내(투표 상태·종료 시각 등) */
  info?: React.ReactNode
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fallback below */
  }
  try {
    const el = document.createElement('textarea')
    el.value = value
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

/**
 * 공유 창. 선택은 Facebook, Instagram, 링크 복사만.
 * Instagram 공식 웹 공유 주소가 없어 문구+링크를 복사한 뒤 인스타그램을 새 탭으로 연다.
 * 실제 게시는 사용자가 각 앱 화면에서 직접 한다. 공유는 투표 수와 무관하다(서버 호출 없음).
 */
export function VoteShareSheet({ open, onClose, url, title, defaultText, editable, info }: Props) {
  const t = useTranslations('voteShare')
  const [text, setText] = useState(defaultText)

  useEffect(() => {
    if (open) setText(defaultText)
  }, [open, defaultText])

  if (!open) return null

  const payload = () => shareMessage(text, url)

  const onCopy = async () => {
    if (await copyText(payload())) toast.success(t('copied'))
    else toast.error(t('copyFailed'))
  }

  const onInstagram = async () => {
    // 공식 링크 공유 URL이 없어 문구+링크를 복사하고, 붙여 넣도록 안내한 뒤 인스타그램을 연다.
    if (await copyText(payload())) toast.success(t('instagramHint'))
    else toast.error(t('copyFailed'))
    window.open(INSTAGRAM_WEB_URL, '_blank', 'noopener,noreferrer')
  }

  const btn =
    'flex min-h-11 w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="vote-share-sheet"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500" aria-label={t('close')}>
            ✕
          </button>
        </div>
        {info ? <div className="mt-2 text-sm text-gray-600">{info}</div> : null}
        {editable ? (
          <label className="mt-3 block text-sm font-medium text-gray-800">
            {t('editText')}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] p-2 text-sm text-gray-900"
              data-testid="vote-share-text"
            />
          </label>
        ) : (
          <p className="mt-3 text-sm text-gray-700">{text}</p>
        )}
        <p className="mt-2 break-all rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600" data-testid="vote-share-url">
          {url}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={facebookShareUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            className={btn + ' no-underline'}
            data-testid="vote-share-facebook"
          >
            {t('facebook')}
          </a>
          <button type="button" className={btn} onClick={() => void onInstagram()} data-testid="vote-share-instagram">
            {t('instagram')}
          </button>
          <button type="button" className={btn + ' col-span-2'} onClick={() => void onCopy()} data-testid="vote-share-copy">
            {t('copy')}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">{t('noVoteEffect')}</p>
      </div>
    </div>
  )
}
