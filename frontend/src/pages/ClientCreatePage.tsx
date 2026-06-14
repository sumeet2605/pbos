import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/client'
import { EntityForm } from '@/components/forms/EntityForm'
import type { ClientCreate } from '@/generated/client'
import { useCreateClientMutation } from '@/hooks/useClientHooks'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.'),
  code: z.string().trim().min(1, 'Client code is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
})

export function ClientCreatePage() {
  const navigate = useNavigate()
  const createClientMutation = useCreateClientMutation()
  const { notification } = AntApp.useApp()

  return (
    <Card>
      <Typography.Title level={3}>Create Client</Typography.Title>
      <Typography.Paragraph type="secondary">
        Register a new client inside the current organization.
      </Typography.Paragraph>
      <EntityForm<ClientCreate>
        schema={clientSchema}
        defaultValues={{
          name: '',
          code: '',
          description: '',
          status: 'active',
        }}
        submitText="Create Client"
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
        footer={<Button onClick={() => navigate('/clients')}>Cancel</Button>}
        onSubmit={async (values) => {
          try {
            const client = await createClientMutation.mutateAsync({
              ...values,
              code: values.code.trim().toUpperCase(),
              description: values.description?.trim() || undefined,
            })
            notification.success({ message: 'Client created successfully.' })
            navigate(`/clients/${client.id}`)
          } catch (error) {
            notification.error({
              message: 'Unable to create client',
              description: getApiErrorMessage(error),
            })
          }
        }}
      />
    </Card>
  )
}
