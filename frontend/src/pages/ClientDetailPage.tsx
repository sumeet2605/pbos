import { Button, Card, Descriptions, Popconfirm, Space, Tag, Typography, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/client'
import { DataTable } from '@/components/data/DataTable'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import type { ClientResponse, ProjectResponse } from '@/generated/client'
import { useClientQuery, useDeleteClientMutation } from '@/hooks/useClientHooks'
import { useProjectsQuery } from '@/hooks/useProjectHooks'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

export function ClientDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const clientId = id ?? ''
  const deleteClientMutation = useDeleteClientMutation()
  const { notification } = AntApp.useApp()

  const clientQuery = useClientQuery(clientId)
  const relatedProjectsQuery = useProjectsQuery(1, 100)

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
    (project) => project.client_id === clientQuery.data.id
  )

  const columns: ColumnsType<ProjectResponse> = [
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
      render: (status: ProjectResponse['status']) => <Tag>{formatStatusLabel(status)}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
  ]

  const client = clientQuery.data as ClientResponse

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={client.name}
        extra={
          <Space wrap>
            <Button onClick={() => navigate(`/clients/${client.id}/edit`)}>Edit</Button>
            <Popconfirm
              title="Delete client"
              description="This client can only be deleted when it has no active projects."
              okText="Delete"
              okButtonProps={{ danger: true, loading: deleteClientMutation.isPending }}
              onConfirm={async () => {
                try {
                  await deleteClientMutation.mutateAsync(client.id)
                  notification.success({ message: 'Client deleted successfully.' })
                  navigate('/clients')
                } catch (error) {
                  notification.error({
                    message: 'Unable to delete client',
                    description: getApiErrorMessage(error),
                  })
                }
              }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
            <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
          </Space>
        }
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
        <DataTable<ProjectResponse>
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
