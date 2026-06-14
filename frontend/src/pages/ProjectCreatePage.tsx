import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/client'
import { ErrorState, LoadingState, EmptyState } from '@/components/feedback/StateViews'
import { EntityForm } from '@/components/forms/EntityForm'
import type { ProjectCreate } from '@/generated/client'
import { useClientsQuery } from '@/hooks/useClientHooks'
import { useCreateProjectMutation } from '@/hooks/useProjectHooks'

const projectSchema = z.object({
  client_id: z.string().trim().min(1, 'Client is required.'),
  name: z.string().trim().min(1, 'Project name is required.'),
  code: z.string().trim().min(1, 'Project code is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
})

export function ProjectCreatePage() {
  const navigate = useNavigate()
  const createProjectMutation = useCreateProjectMutation()
  const clientsQuery = useClientsQuery(1, 100)
  const { notification } = AntApp.useApp()

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
          action={
            <Button type="primary" onClick={() => navigate('/clients/new')}>
              Create Client
            </Button>
          }
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
      <EntityForm<ProjectCreate>
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
            const project = await createProjectMutation.mutateAsync({
              ...values,
              code: values.code.trim().toUpperCase(),
              description: values.description?.trim() || undefined,
            })
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
