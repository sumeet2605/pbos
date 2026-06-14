import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/client'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { EntityForm } from '@/components/forms/EntityForm'
import type { ProjectUpdate } from '@/generated/client'
import { useClientsQuery } from '@/hooks/useClientHooks'
import { useProjectQuery, useUpdateProjectMutation } from '@/hooks/useProjectHooks'

const projectSchema = z.object({
  client_id: z.string().trim().min(1, 'Client is required.'),
  name: z.string().trim().min(1, 'Project name is required.'),
  code: z.string().trim().min(1, 'Project code is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
})

export function ProjectEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const projectId = id ?? ''
  const { notification } = AntApp.useApp()
  const projectQuery = useProjectQuery(projectId)
  const clientsQuery = useClientsQuery(1, 100)
  const clients = clientsQuery.data?.data ?? []
  const updateProjectMutation = useUpdateProjectMutation(projectId)

  if (!id) {
    return <ErrorState description="Project identifier is missing." />
  }

  if (projectQuery.isLoading || clientsQuery.isLoading) {
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

  if (clientsQuery.error || !clientsQuery.data) {
    return (
      <ErrorState
        description={getApiErrorMessage(clientsQuery.error)}
        onRetry={() => void clientsQuery.refetch()}
      />
    )
  }

  const project = projectQuery.data

  return (
    <Card>
      <Typography.Title level={3}>Edit Project</Typography.Title>
      <Typography.Paragraph type="secondary">
        Update project details using generated backend request contracts.
      </Typography.Paragraph>
      <EntityForm<ProjectUpdate>
        schema={projectSchema}
        defaultValues={{
          client_id: project.client_id,
          name: project.name,
          code: project.code,
          description: project.description ?? '',
          status: project.status,
        }}
        submitText="Save Changes"
        fields={[
          {
            name: 'client_id',
            label: 'Client',
            type: 'select',
            options: clients.map((client) => ({
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
        footer={<Button onClick={() => navigate(`/projects/${id}`)}>Cancel</Button>}
        onSubmit={async (values) => {
          try {
            const projectRecord = await updateProjectMutation.mutateAsync({
              ...values,
              code: values.code?.trim().toUpperCase(),
              description: values.description?.trim() || null,
            })
            notification.success({ message: 'Project updated successfully.' })
            navigate(`/projects/${projectRecord.id}`)
          } catch (error) {
            notification.error({
              message: 'Unable to update project',
              description: getApiErrorMessage(error),
            })
          }
        }}
      />
    </Card>
  )
}
