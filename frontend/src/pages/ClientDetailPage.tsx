import { Button, Card, Descriptions, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/api/client'
import { getClient, listProjects } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { DataTable } from '@/components/data/DataTable'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { Client, Project } from '@/types/entities'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

export function ClientDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const clientQuery = useQuery({
    queryKey: queryKeys.clients.detail(id ?? ''),
    queryFn: () => getClient(id ?? ''),
    enabled: Boolean(id),
  })

  const relatedProjectsQuery = useQuery({
    queryKey: queryKeys.projects.list(1, 100),
    queryFn: () => listProjects({ page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  })

  if (!id) {
    return <ErrorState description="Client identifier is missing." />
  }

  if (clientQuery.isLoading) {
    return <LoadingState title="Loading client" />
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <ErrorState
        description={getApiErrorMessage(clientQuery.error)}
        onRetry={() => void clientQuery.refetch()}
      />
    )
  }

  const relatedProjects = (relatedProjectsQuery.data?.data ?? []).filter(
    (project) => project.client_id === clientQuery.data?.id
  )

  const columns: ColumnsType<Project> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, project) => <Link to={`/projects/${project.id}`}>{project.name}</Link>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => <Tag>{formatStatusLabel(status)}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
  ]

  const client = clientQuery.data as Client

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={client.name}
        extra={<Button onClick={() => navigate('/clients')}>Back to Clients</Button>}
      >
        <Descriptions column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label="Code">{client.code}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag>{formatStatusLabel(client.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {client.description || 'No description provided.'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">{formatDateTime(client.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Updated">{formatDateTime(client.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Projects for this client">
        <Typography.Paragraph type="secondary">
          Related projects are sourced from the current organization project list.
        </Typography.Paragraph>
        <DataTable<Project>
          columns={columns}
          dataSource={relatedProjects}
          loading={relatedProjectsQuery.isLoading}
          error={relatedProjectsQuery.error ? getApiErrorMessage(relatedProjectsQuery.error) : null}
          onRetry={() => void relatedProjectsQuery.refetch()}
          emptyDescription="No projects linked to this client yet."
          pagination={false}
        />
      </Card>
    </Space>
  )
}
