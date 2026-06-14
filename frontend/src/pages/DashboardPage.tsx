import { useMemo } from 'react'
import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/client'
import { ErrorState, EmptyState, LoadingState } from '@/components/feedback/StateViews'
import { useAuditEventsQuery } from '@/hooks/useAuditHooks'
import { useClientsQuery } from '@/hooks/useClientHooks'
import { useProjectsQuery } from '@/hooks/useProjectHooks'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

export function DashboardPage() {
  const currentUser = useAuthStore((state) => state.user)
  const clientsQuery = useClientsQuery(1, 5)
  const projectsQuery = useProjectsQuery(1, 5)
  const auditQuery = useAuditEventsQuery(1, 5)

  const blockingError = !clientsQuery.data && !projectsQuery.data && !auditQuery.data
  const hasAnyLoading = clientsQuery.isLoading || projectsQuery.isLoading || auditQuery.isLoading

  const metrics = useMemo(
    () => [
      {
        title: 'Clients',
        value: clientsQuery.data?.meta.total ?? 0,
      },
      {
        title: 'Projects',
        value: projectsQuery.data?.meta.total ?? 0,
      },
      {
        title: 'Audit Events',
        value: auditQuery.data?.meta.total ?? 0,
      },
    ],
    [auditQuery.data?.meta.total, clientsQuery.data?.meta.total, projectsQuery.data?.meta.total]
  )

  if (hasAnyLoading && blockingError) {
    return <LoadingState title="Loading dashboard" />
  }

  if (blockingError) {
    return (
      <ErrorState
        description={
          getApiErrorMessage(clientsQuery.error) ||
          getApiErrorMessage(projectsQuery.error) ||
          getApiErrorMessage(auditQuery.error)
        }
        onRetry={() => {
          void clientsQuery.refetch()
          void projectsQuery.refetch()
          void auditQuery.refetch()
        }}
      />
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Welcome back{currentUser ? `, ${currentUser.full_name}` : ''}
        </Typography.Title>
        <Typography.Text type="secondary">
          Review organization health, recent activity, and operational entities from one workspace.
        </Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col key={metric.title} xs={24} md={8}>
            <Card>
              <Statistic title={metric.title} value={metric.value} loading={hasAnyLoading && !metric.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Recent Clients" extra={<Link to="/clients">View all</Link>}>
            {clientsQuery.data?.data.length ? (
              <List
                dataSource={clientsQuery.data.data}
                renderItem={(client) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/clients/${client.id}`}>{client.name}</Link>}
                      description={client.code}
                    />
                    <Tag>{formatStatusLabel(client.status)}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <EmptyState description="No clients available yet." />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Recent Projects" extra={<Link to="/projects">View all</Link>}>
            {projectsQuery.data?.data.length ? (
              <List
                dataSource={projectsQuery.data.data}
                renderItem={(project) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/projects/${project.id}`}>{project.name}</Link>}
                      description={project.code}
                    />
                    <Tag>{formatStatusLabel(project.status)}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <EmptyState description="No projects available yet." />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Latest Audit Activity" extra={<Link to="/audit">Open viewer</Link>}>
        {auditQuery.data?.data.length ? (
          <List
            dataSource={auditQuery.data.data}
            renderItem={(event) => (
              <List.Item>
                <List.Item.Meta
                  title={`${event.action} · ${event.entity_type}`}
                  description={formatDateTime(event.created_at)}
                />
                <Tag color="blue">{event.entity_type}</Tag>
              </List.Item>
            )}
          />
        ) : (
          <EmptyState description="No audit events captured yet." />
        )}
      </Card>
    </Space>
  )
}
