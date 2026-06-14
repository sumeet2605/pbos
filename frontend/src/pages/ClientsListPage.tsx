import { useState } from 'react'
import { Button, Card, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/client'
import { DataTable } from '@/components/data/DataTable'
import type { ClientResponse } from '@/generated/client'
import { useClientsQuery } from '@/hooks/useClientHooks'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

const PAGE_SIZE = 10

export function ClientsListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const clientsQuery = useClientsQuery(page, PAGE_SIZE)

  const columns: ColumnsType<ClientResponse> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, client) => <Link to={`/clients/${client.id}`}>{client.name}</Link>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: ClientResponse['status']) => <Tag>{formatStatusLabel(status)}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, client) => <Link to={`/clients/${client.id}/edit`}>Edit</Link>,
    },
  ]

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Title level={3}>Clients</Typography.Title>
            <Typography.Text type="secondary">
              Browse active organization clients and open each record for detail context.
            </Typography.Text>
          </div>
          <Button type="primary" onClick={() => navigate('/clients/new')}>
            Create Client
          </Button>
        </div>
        <DataTable<ClientResponse>
          columns={columns}
          dataSource={clientsQuery.data?.data ?? []}
          loading={clientsQuery.isLoading}
          error={clientsQuery.error ? getApiErrorMessage(clientsQuery.error) : null}
          onRetry={() => void clientsQuery.refetch()}
          paginationMeta={clientsQuery.data?.meta ?? null}
          onPageChange={(nextPage) => setPage(nextPage)}
          emptyDescription="No clients found for this organization."
        />
      </Space>
    </Card>
  )
}
