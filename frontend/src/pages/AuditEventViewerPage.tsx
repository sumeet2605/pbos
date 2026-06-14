import { useState } from 'react'
import { Button, Card, Input, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/api/client'
import { listAuditEvents } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { DataTable } from '@/components/data/DataTable'
import { AuditEvent } from '@/types/entities'
import { formatDateTime, formatIdentifier, formatStatusLabel } from '@/utils/format'

const PAGE_SIZE = 20

export function AuditEventViewerPage() {
  const [page, setPage] = useState(1)
  const [draftEntityType, setDraftEntityType] = useState<string | undefined>()
  const [draftAction, setDraftAction] = useState('')
  const [entityType, setEntityType] = useState<string | undefined>()
  const [action, setAction] = useState('')

  const auditQuery = useQuery({
    queryKey: queryKeys.audit.list(page, PAGE_SIZE, entityType, action),
    queryFn: () =>
      listAuditEvents({
        page,
        pageSize: PAGE_SIZE,
        entityType,
        action: action || undefined,
      }),
  })

  const columns: ColumnsType<AuditEvent> = [
    {
      title: 'When',
      dataIndex: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (value: string) => <Tag color="blue">{formatStatusLabel(value)}</Tag>,
    },
    {
      title: 'Entity Type',
      dataIndex: 'entity_type',
      render: (value: string) => <Tag>{formatStatusLabel(value)}</Tag>,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entity_id',
      render: (value: string) => formatIdentifier(value),
    },
    {
      title: 'Actor ID',
      dataIndex: 'actor_id',
      render: (value: string | null) => formatIdentifier(value),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (value: Record<string, unknown> | null) =>
        value ? (
          <Typography.Text code>{JSON.stringify(value)}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">No details</Typography.Text>
        ),
    },
  ]

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3}>Audit Event Viewer</Typography.Title>
          <Typography.Text type="secondary">
            Inspect organization activity sourced directly from backend audit events.
          </Typography.Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Entity type"
            style={{ width: 180 }}
            value={draftEntityType}
            onChange={(value) => setDraftEntityType(value)}
            options={[
              { label: 'Client', value: 'client' },
              { label: 'Project', value: 'project' },
              { label: 'User', value: 'user' },
            ]}
          />
          <Input
            placeholder="Action"
            style={{ width: 220 }}
            value={draftAction}
            onChange={(event) => setDraftAction(event.target.value)}
          />
          <Button
            type="primary"
            onClick={() => {
              setPage(1)
              setEntityType(draftEntityType)
              setAction(draftAction.trim())
            }}
          >
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setPage(1)
              setDraftEntityType(undefined)
              setDraftAction('')
              setEntityType(undefined)
              setAction('')
            }}
          >
            Reset
          </Button>
        </Space>
        <DataTable<AuditEvent>
          columns={columns}
          dataSource={auditQuery.data?.data ?? []}
          loading={auditQuery.isLoading}
          error={auditQuery.error ? getApiErrorMessage(auditQuery.error) : null}
          onRetry={() => void auditQuery.refetch()}
          paginationMeta={auditQuery.data?.meta ?? null}
          onPageChange={(nextPage) => setPage(nextPage)}
          emptyDescription="No audit events match the current filters."
        />
      </Space>
    </Card>
  )
}
