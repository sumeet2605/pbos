import { Button, Card, Descriptions, Popconfirm, Space, Tag, App as AntApp } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/client'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { useClientQuery } from '@/hooks/useClientHooks'
import { useDeleteProjectMutation, useProjectQuery } from '@/hooks/useProjectHooks'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const projectId = id ?? ''
  const deleteProjectMutation = useDeleteProjectMutation()
  const { notification } = AntApp.useApp()
  const projectQuery = useProjectQuery(projectId)
  const clientQuery = useClientQuery(projectQuery.data?.client_id ?? '')

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
        extra={
          <Space wrap>
            <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>Edit</Button>
            <Popconfirm
              title="Delete project"
              description="This action will soft-delete the project from organization views."
              okText="Delete"
              okButtonProps={{ danger: true, loading: deleteProjectMutation.isPending }}
              onConfirm={async () => {
                try {
                  await deleteProjectMutation.mutateAsync(project.id)
                  notification.success({ message: 'Project deleted successfully.' })
                  navigate('/projects')
                } catch (error) {
                  notification.error({
                    message: 'Unable to delete project',
                    description: getApiErrorMessage(error),
                  })
                }
              }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
            <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
          </Space>
        }
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
