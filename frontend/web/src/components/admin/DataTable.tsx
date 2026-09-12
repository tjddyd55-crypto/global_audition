'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AUDITION_DETAIL } from '@/shared/design-tokens'

export type DataTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  width?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  emptyMessage?: string
  getRowKey: (row: T) => string
}

/** Admin list table. Horizontal scroll only; used inside a card. */
export function DataTable<T>({ columns, rows, emptyMessage, getRowKey }: DataTableProps<T>) {
  const t = useTranslations('common')
  const resolvedEmptyMessage = emptyMessage ?? t('noData')

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: AUDITION_DETAIL.bodyFontPx,
          color: AUDITION_DETAIL.bodyColor,
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${AUDITION_DETAIL.cardBorderColor}` }}>
            {columns.map((col) => (
              <th
                key={col.id}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '24px 12px', textAlign: 'center', color: '#888' }}>
                {resolvedEmptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} style={{ borderBottom: `1px solid ${AUDITION_DETAIL.cardBorderColor}` }}>
                {columns.map((col) => (
                  <td key={col.id} style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
