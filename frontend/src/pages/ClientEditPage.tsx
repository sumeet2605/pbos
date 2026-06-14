import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/client'
import { EntityForm } from '@/components/forms/EntityForm'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import type { ClientUpdate } from '@/generated/client'
import { useClientQuery, useUpdateClientMutation } from '@/hooks/useClientHooks'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.'),
  code: z.string().trim().min(1, 'Client code is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
})

export function ClientEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const clientId = id ?? ''
  const { notification } = AntApp.useApp()
  const clientQuery = useClientQuery(clientId)
  const updateClientMutation = useUpdateClientMutation(clientId)

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

  const client = clientQuery.data

  return (
    <Card>
      <Typography.Title level={3}>Edit Client</Typography.Title>
      <Typography.Paragraph type="secondary">
        Update the selected client using backend-generated request contracts.
      </Typography.Paragraph>
      <EntityForm<ClientUpdate>
        schema={clientSchema}
        defaultValues={{
          name: client.name,
          code: client.code,
          description: client.description ?? '',
          status: client.status,
        }}
        submitText="Save Changes"
        fields={[
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
        footer={<Button onClick={() => navigate(`/clients/${id}`)}>Cancel</Button>}
        onSubmit={async (values) => {
          try {
            const updatedClient = await updateClientMutation.mutateAsync({
              ...values,
              code: values.code?.trim().toUpperCase(),
              description: values.description?.trim() || null,
            })
            notification.success({ message: 'Client updated successfully.' })
            navigate(`/clients/${updatedClient.id}`)
          } catch (error) {
            notification.error({
              message: 'Unable to update client',
              description: getApiErrorMessage(error),
            })
          }
        }}
      />
    </Card>
  )
}
