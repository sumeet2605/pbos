import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/client'
import { createProject, listClients } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { EntityForm } from '@/components/forms/EntityForm'
import { ProjectFormValues } from '@/types/entities'

const projectSchema = z.object({
  client_id: z.string().trim().min(1, 'Client is required.'),
  name: z.string().trim().min(1, 'Project name is required.'),
  code: z.string().trim().min(1, 'Project code is required.'),
  description: z.string().trim().optional(),
  status: z.string().trim().min(1, 'Status is required.'),
})

export function ProjectCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notification } = AntApp.useApp()

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients.list(1, 100),
    queryFn: () => listClients({ page: 1, pageSize: 100 }),
  })

  if (clientsQuery.isLoading) {
    return <LoadingState title="Loading clients" description="Projects require an existing client." />
  }

  if (clientsQuery.error) {
    return (
      <ErrorState
        description={getApiErrorMessage(clientsQuery.error)}
        onRetry={() => void clientsQuery.refetch()}
      />
    )
  }

  if (!clientsQuery.data?.data.length) {
    return (
      <Card>
        <EmptyState
          description="Create a client before creating a project."
          action={<Button type="primary" onClick={() => navigate('/clients/new')}>Create Client</Button>}
        />
      </Card>
    )
  }

  return (
    <Card>
      <Typography.Title level={3}>Create Project</Typography.Title>
      <Typography.Paragraph type="secondary">
        Register a new project against an existing client.
      </Typography.Paragraph>
      <EntityForm<ProjectFormValues>
        schema={projectSchema}
        defaultValues={{
          client_id: clientsQuery.data.data[0]?.id ?? '',
          name: '',
          code: '',
          description: '',
          status: 'active',
        }}
        submitText="Create Project"
        fields={[
          {
            name: 'client_id',
            label: 'Client',
            type: 'select',
            options: clientsQuery.data.data.map((client) => ({
              label: `${client.name} (${client.code})`,
              value: client.id,
            })),
          },
          { name: 'name', label: 'Name', span: 12 },
          { name: 'code', label: 'Code', span: 12 },
          { name: 'description', label: 'Description', type: 'textarea' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
            span: 12,
          },
        ]}
        footer={<Button onClick={() => navigate('/projects')}>Cancel</Button>}
        onSubmit={async (values) => {
          try {
            const project = await createProject({
              ...values,
              code: values.code.trim().toUpperCase(),
              description: values.description?.trim() || undefined,
            })
            await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
            await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
            notification.success({ message: 'Project created successfully.' })
            navigate(`/projects/${project.id}`)
          } catch (error) {
            notification.error({
              message: 'Unable to create project',
              description: getApiErrorMessage(error),
            })
          }
        }}
      />
    </Card>
  )
}
