export function parseEntryNumber(raw: unknown): number | undefined {
  if (typeof raw !== 'number' && typeof raw !== 'string') return undefined
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}

export type NumberHistoryItem = { kind: 'RECEIPT' | 'REVIEW' | 'VOTE'; roundNumber: number; number: number }
export function parseNumberHistory(raw: unknown): NumberHistoryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const number = parseEntryNumber(row.number)
    const round = parseEntryNumber(row.roundNumber)
    if (!number || !['RECEIPT', 'REVIEW', 'VOTE'].includes(row.kind) || (row.kind !== 'RECEIPT' && !round)) return []
    return [{ kind: row.kind, number, roundNumber: row.kind === 'RECEIPT' ? 0 : round! }]
  })
}
export const numberHistoryLabelKey = (kind: NumberHistoryItem['kind']) =>
  kind === 'RECEIPT' ? 'receiptNumber' : kind === 'REVIEW' ? 'reviewNumber' : 'voteNumberHistory'
