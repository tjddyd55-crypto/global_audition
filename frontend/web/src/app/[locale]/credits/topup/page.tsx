'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import {
  creditsApi,
  type CreditPackageCatalogItem,
  type PaymentMethodOffer,
  type PaymentOrderView,
  type PaymentQuote,
} from '@/shared/api/credits'
import { formatMinorAmount } from '@/shared/money/minor'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const COUNTRIES = ['KR', 'JP', 'PH', 'US', 'MN'] as const

export default function CreditTopUpPage() {
  const t = useTranslations('payments')
  const router = useRouter()
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>('KR')
  const [methods, setMethods] = useState<PaymentMethodOffer[]>([])
  const [packages, setPackages] = useState<CreditPackageCatalogItem[]>([])
  const [methodId, setMethodId] = useState('')
  const [packageId, setPackageId] = useState('')
  const [quote, setQuote] = useState<PaymentQuote | null>(null)
  const [order, setOrder] = useState<PaymentOrderView | null>(null)
  const [history, setHistory] = useState<PaymentOrderView[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [nextMethods, nextPackages, mine] = await Promise.all([
          creditsApi.listPaymentMethods(country),
          creditsApi.listPackages(),
          creditsApi.myPaymentOrders(),
        ])
        if (cancelled) return
        setMethods(nextMethods)
        setPackages(nextPackages)
        setHistory(mine)
        setMethodId(nextMethods[0]?.id ?? '')
        setPackageId((current) => current || nextPackages[0]?.id || '')
        setQuote(null)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'LOAD_FAILED')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [country])

  const selected = methods.find((row) => row.id === methodId) ?? null

  const loadQuote = async () => {
    if (!selected || !packageId) return
    setBusy(true)
    setError(null)
    try {
      const next = await creditsApi.quotePayment({
        packageId,
        paymentCountry: country,
        providerId: selected.providerId,
        methodCode: selected.methodCode,
      })
      setQuote(next)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'QUOTE_FAILED')
    } finally {
      setBusy(false)
    }
  }

  const proceed = async () => {
    if (!selected || !packageId || !quote) return
    setBusy(true)
    setError(null)
    try {
      const created = await creditsApi.createPaymentOrder({
        packageId,
        paymentCountry: country,
        providerId: selected.providerId,
        methodCode: selected.methodCode,
        idempotencyKey: crypto.randomUUID(),
      })
      setOrder(created)
      setHistory(await creditsApi.myPaymentOrders())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ORDER_FAILED')
    } finally {
      setBusy(false)
    }
  }

  const act = async (kind: 'SUCCESS' | 'FAIL' | 'CANCEL') => {
    if (!order || order.chargeAmountMinor == null) return
    setBusy(true)
    setError(null)
    try {
      const next =
        kind === 'CANCEL'
          ? await creditsApi.cancelPaymentOrder(order.orderNo)
          : await creditsApi.confirmPaymentOrder(order.orderNo, {
              scenario: kind,
              chargeAmountMinor: order.chargeAmountMinor,
            })
      setOrder(next)
      setHistory(await creditsApi.myPaymentOrders())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CONFIRM_FAILED')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-8">
        <h1 className={TITLE_PAGE}>{t('topUp')}</h1>
        <label className="flex flex-col gap-1 text-sm">
          {t('paymentCountry')}
          <select className="rounded border px-3 py-2" value={country} onChange={(event) => setCountry(event.target.value as (typeof COUNTRIES)[number])}>
            {COUNTRIES.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </label>
        {methods.length === 0 ? <p className={TEXT_SUB}>{t('noMethod')}</p> : (
          <label className="flex flex-col gap-1 text-sm">
            {t('selectMethod')}
            <select className="rounded border px-3 py-2" value={methodId} onChange={(event) => { setMethodId(event.target.value); setQuote(null) }}>
              {methods.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.providerName} · {row.methodCode} · {row.currency} · {row.environment}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t('packageName')}
          <select className="rounded border px-3 py-2" value={packageId} onChange={(event) => { setPackageId(event.target.value); setQuote(null) }}>
            {packages.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
        </label>
        <button type="button" className={BTN_SECONDARY} disabled={busy || !selected} onClick={() => void loadQuote()}>
          {t('orderSummary')}
        </button>
        {quote && (
          <div className={CARD_BASE}>
            <p>{t('creditsToIssue')}: {formatCreditsCount(quote.credits)}</p>
            <p>{t('chargeAmount')}: {formatMinorAmount(quote.chargeAmountMinor, quote.scale, quote.chargeCurrency)}</p>
            <p>{t('merchantCountry')}: {quote.merchantCountry}</p>
            <p>{t('environmentLabel')}: {quote.environment}</p>
          </div>
        )}
        <button type="button" className={BTN_PRIMARY} disabled={busy || !quote} onClick={() => void proceed()}>
          {t('createOrder')}
        </button>
        {order && order.environment === 'MOCK' && order.status === 'READY' && (
          <div className="flex gap-2">
            <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={() => void act('SUCCESS')}>{t('success')}</button>
            <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => void act('FAIL')}>{t('fail')}</button>
            <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => void act('CANCEL')}>{t('cancel')}</button>
          </div>
        )}
        {order && <p className={TEXT_SUB}>{order.orderNo} · {order.status}{order.failReason ? ` · ${order.failReason}` : ''}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <h2 className="text-lg font-semibold">{t('history')}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {history.map((row) => (
            <li key={row.orderNo} className={CARD_BASE}>
              {row.orderNo} · {row.status} · {row.environment} · {formatCreditsCount(row.credits)} ·{' '}
              {row.chargeAmountMinor != null && row.scale != null && row.chargeCurrency
                ? formatMinorAmount(row.chargeAmountMinor, row.scale, row.chargeCurrency)
                : row.chargeCurrency}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
