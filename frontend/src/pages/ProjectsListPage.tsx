import { useMemo, useState } from 'react'
import { Button, Card, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/api/client'
import { listClients, listProjects } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { DataTable } from '@/components/data/DataTable'
import { Project } from '@/types/entities'
import { formatDateTime, formatStatusLabel } from '@/utils/format'

const PAGE_SIZE = 10

export function ProjectsListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(page, PAGE_SIZE),
    queryFn: () => listProjects({ page, pageSize: PAGE_SIZE }),
  })
  const clientsQuery = useQuery({
    queryKey: queryKeys.clients.list(1, 100),
    queryFn: () => listClients({ page: 1, pageSize: 100 }),
  })

  const clientNameById = useMemo(
    () =>
      new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.name] as const)),
    [clientsQuery.data?.data]
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
      title: 'Client',
      dataIndex: 'client_id',
      render: (clientId: string) => clientNameById.get(clientId) ?? clientId,
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
    {
      title: 'Action',
      key: 'action',
      render: (_, project) => <Link to={`/projects/${project.id}`}>View details</Link>,
    },
  ]

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Title level={3}>Projects</Typography.Title>
            <Typography.Text type="secondary">
              Explore organization projects and trace each one back to its client.
            </Typography.Text>
          </div>
          <Button type="primary" onClick={() => navigate('/projects/new')}>
            Create Project
          </Button>
        </div>
        <DataTable<Project>
          columns={columns}
          dataSource={projectsQuery.data?.data ?? []}
          loading={projectsQuery.isLoading}
          error={projectsQuery.error ? getApiErrorMessage(projectsQuery.error) : null}
          onRetry={() => void projectsQuery.refetch()}
          paginationMeta={projectsQuery.data?.meta ?? null}
          onPageChange={(nextPage) => setPage(nextPage)}
          emptyDescription="No projects found for this organization."
        />
      </Space>
    </Card>
  )
}
