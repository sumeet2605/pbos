import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ColumnsType } from 'antd/es/table'
import { DataTable } from '@/components/data/DataTable'

interface Row {
  id: string
  name: string
}

const columns: ColumnsType<Row> = [
  { title: 'ID', dataIndex: 'id' },
  { title: 'Name', dataIndex: 'name' },
]

describe('DataTable', () => {
  it('renders rows from dataSource', () => {
    const rows: Row[] = [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ]
    render(<DataTable columns={columns} dataSource={rows} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows emptyDescription when dataSource is empty', () => {
    render(
      <DataTable columns={columns} dataSource={[]} emptyDescription="Nothing here yet." />
    )
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('shows error alert when error is present and data exists', () => {
    const rows: Row[] = [{ id: '1', name: 'Alpha' }]
    render(
      <DataTable
        columns={columns}
        dataSource={rows}
        error="Failed to load."
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByText('Failed to load.')).toBeInTheDocument()
  })

  it('does not show error alert when there is no data', () => {
    render(
      <DataTable columns={columns} dataSource={[]} error="Failed to load." />
    )
    expect(screen.queryByText('Failed to load.')).not.toBeInTheDocument()
  })

  it('calls onRetry when Retry button is clicked in error alert', async () => {
    const onRetry = vi.fn()
    const rows: Row[] = [{ id: '1', name: 'Alpha' }]
    render(
      <DataTable
        columns={columns}
        dataSource={rows}
        error="Failed."
        onRetry={onRetry}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders column headers', () => {
    render(<DataTable columns={columns} dataSource={[]} />)
    const idHeaders = screen.getAllByText('ID')
    expect(idHeaders.length).toBeGreaterThan(0)
    const nameHeaders = screen.getAllByText('Name')
    expect(nameHeaders.length).toBeGreaterThan(0)
  })
})
