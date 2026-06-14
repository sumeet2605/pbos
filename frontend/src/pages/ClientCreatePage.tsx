import { Button, Card, Typography, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { EntityForm } from '@/components/forms/EntityForm'
import { createClient } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { ClientFormValues } from '@/types/entities'
import { getApiErrorMessage } from '@/api/client'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.'),
  code: z.string().trim().min(1, 'Client code is required.'),
  description: z.string().trim().optional(),
  status: z.string().trim().min(1, 'Status is required.'),
})

export function ClientCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notification } = AntApp.useApp()

  return (
    <Card>
      <Typography.Title level={3}>Create Client</Typography.Title>
      <Typography.Paragraph type="secondary">
        Register a new client inside the current organization.
      </Typography.Paragraph>
      <EntityForm<ClientFormValues>
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
            const client = await createClient({
              ...values,
              code: values.code.trim().toUpperCase(),
              description: values.description?.trim() || undefined,
            })
            await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
            await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
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
