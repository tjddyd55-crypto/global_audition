'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePointQuote } from '@/shared/audition/usePointQuote'
import type { PointPayment, PointQuote } from '@/shared/audition/points'

export function useApplyPayment(enabled: boolean) {
  const quote = usePointQuote(enabled)
  const [method, select] = useState<PointPayment | null>(null)
  const data = quote.data
  const choosing = !!data && (data.pointAllowed || method !== null)
  const enoughPoints = !!data && data.pointBalance >= data.pointCost
  const disabled = choosing && (method === null || (method === 'POINT' ? !data.pointAllowed || !enoughPoints : data.creditBalance < data.creditCost))
  return { quote, method, select, choosing, disabled,
    payload: choosing && method === 'POINT' ? { paymentMethod: 'POINT' as const, expectedPointCost: data.pointCost } : {},
  }
}

export function ApplyPaymentChoice({ quote, method, onSelect }: {
  quote: PointQuote
  method: PointPayment | null
  onSelect: (method: PointPayment) => void
}) {
  const t = useTranslations('points')
  return (
    <fieldset className="mb-4 space-y-3 rounded-xl border border-violet-200 bg-white p-4">
      <legend className="px-1 font-semibold">{t('choose')}</legend>
      <p className="text-sm">{t('credit')} <strong>{quote.creditBalance} C</strong> · {t('balance')} <strong>{quote.pointBalance} P</strong></p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-12 items-center gap-2 rounded-lg border p-3">
          <input type="radio" name="application-payment" value="CREDIT" checked={method === 'CREDIT'} onChange={() => onSelect('CREDIT')} />
          {t('creditMethod', { n: quote.creditCost })}
        </label>
        <label className="flex min-h-12 items-center gap-2 rounded-lg border p-3">
          <input type="radio" name="application-payment" value="POINT" disabled={!quote.pointAllowed} checked={method === 'POINT'} onChange={() => onSelect('POINT')} />
          {t('pointMethod', { n: quote.pointCost })}
        </label>
      </div>
      {quote.pointBalance < quote.pointCost ? <p className="text-sm text-amber-800">{t('shortfall', { n: quote.pointCost - quote.pointBalance })}</p> : null}
    </fieldset>
  )
}
