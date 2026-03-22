'use client'

import type { ReactNode } from 'react'
import { AUDITION_DETAIL } from '@/lib/design-tokens'

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

/**
 * 관리자 리스트용 테이블. 카드 내부에서 사용 — 가로 스크롤만 허용.
 */
export function DataTable<T>({ columns, rows, emptyMessage = '데이터가 없습니다.', getRowKey }: DataTableProps<T>) {
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
                {emptyMessage}
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
