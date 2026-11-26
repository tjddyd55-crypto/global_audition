import { render, screen } from '@testing-library/react'
import { DataTable, type DataTableColumn } from '../DataTable'

type Row = { id: string; name: string }
const columns: DataTableColumn<Row>[] = [{ id: 'name', header: '패키지명', cell: row => row.name }]

it('renders populated and empty admin tables outside a locale provider', () => {
  const getRowKey = (row: Row) => row.id
  const emptyMessage = '데이터가 없습니다.'
  const { rerender } = render(<DataTable columns={columns} rows={[{ id: 'one', name: '기본 패키지' }]} emptyMessage={emptyMessage} getRowKey={getRowKey} />)
  expect(screen.getByRole('cell', { name: '기본 패키지' })).toBeTruthy()
  rerender(<DataTable columns={columns} rows={[]} emptyMessage={emptyMessage} getRowKey={getRowKey} />)
  expect(screen.getByRole('cell', { name: emptyMessage })).toBeTruthy()
})
