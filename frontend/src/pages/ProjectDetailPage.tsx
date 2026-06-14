import { Button, Card, Descriptions, Space, Tag } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/api/client'
import { getClient, getProject } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const projectQuery = useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => getProject(id ?? ''),
    enabled: Boolean(id),
  })

  const clientQuery = useQuery({
    queryKey: queryKeys.clients.detail(projectQuery.data?.client_id ?? ''),
    queryFn: () => getClient(projectQuery.data?.client_id ?? ''),
    enabled: Boolean(projectQuery.data?.client_id),
  })

  if (!id) {
    return <ErrorState description="Project identifier is missing." />
  }

  if (projectQuery.isLoading) {
    return <LoadingState title="Loading project" />
  }

  if (projectQuery.error || !projectQuery.data) {
    return (
      <ErrorState
        description={getApiErrorMessage(projectQuery.error)}
        onRetry={() => void projectQuery.refetch()}
      />
    )
  }

  const project = projectQuery.data

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={project.name}
        extra={<Button onClick={() => navigate('/projects')}>Back to Projects</Button>}
      >
        <Descriptions column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label="Code">{project.code}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag>{formatStatusLabel(project.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Client">
            {clientQuery.data ? (
              <Link to={`/clients/${clientQuery.data.id}`}>{clientQuery.data.name}</Link>
            ) : (
              project.client_id
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {project.description || 'No description provided.'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">{formatDateTime(project.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Updated">{formatDateTime(project.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )
}
