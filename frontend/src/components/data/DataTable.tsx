import { Alert, Button, Table, TableProps } from 'antd'
import { EmptyState } from '@/components/feedback/StateViews'
import { PaginationMeta } from '@/types/common'

interface DataTableProps<T extends object> extends TableProps<T> {
  error?: string | null
  onRetry?: () => void
  paginationMeta?: PaginationMeta | null
  onPageChange?: (page: number, pageSize: number) => void
  emptyDescription?: string
}

export function DataTable<T extends object>({
  error,
  onRetry,
  paginationMeta,
  onPageChange,
  emptyDescription = 'No records found.',
  locale,
  ...tableProps
}: DataTableProps<T>) {
  const hasData = Boolean(tableProps.dataSource && tableProps.dataSource.length > 0)

  return (
    <>
      {error && hasData ? (
        <Alert
          type="warning"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          action={
            onRetry ? (
              <Button size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <Table<T>
        rowKey={tableProps.rowKey ?? 'id'}
        scroll={{ x: true }}
        pagination={
          paginationMeta
            ? {
                current: paginationMeta.page,
                pageSize: paginationMeta.page_size,
                total: paginationMeta.total,
                showSizeChanger: false,
                onChange: (page, pageSize) => onPageChange?.(page, pageSize),
              }
            : false
        }
        locale={{
          emptyText: <EmptyState description={emptyDescription} />,
          ...locale,
        }}
        {...tableProps}
      />
    </>
  )
}
