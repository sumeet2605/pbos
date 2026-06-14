import { Card, Col, Row, Space, Typography, App as AntApp } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { EntityForm } from '@/components/forms/EntityForm'
import { getApiErrorMessage } from '@/api/client'
import { login } from '@/api/services'
import type { LoginRequest } from '@/generated/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  organization_slug: z.string().trim().min(1, 'Organization slug is required.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { notification } = AntApp.useApp()
  const setTokens = useAuthStore((state) => state.setTokens)
  const clearSession = useAuthStore((state) => state.clearSession)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: 24 }}>
      <Col xs={24} sm={22} md={18} lg={14} xl={10}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={2}>Sign in to CBOS</Typography.Title>
              <Typography.Paragraph type="secondary">
                Access your organization workspace, manage clients and projects, and review audit activity.
              </Typography.Paragraph>
            </div>
            <EntityForm<LoginRequest>
              schema={loginSchema}
              defaultValues={{
                organization_slug: '',
                email: '',
                password: '',
              }}
              submitText="Login"
              fields={[
                {
                  name: 'organization_slug',
                  label: 'Organization Slug',
                  placeholder: 'your-organization',
                },
                {
                  name: 'email',
                  label: 'Email',
                  placeholder: 'name@example.com',
                },
                {
                  name: 'password',
                  label: 'Password',
                  type: 'password',
                },
              ]}
              onSubmit={async (values) => {
                try {
                  const tokens = await login(values)
                  setTokens(tokens, values.organization_slug)
                  await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
                  navigate(redirectTo, { replace: true })
                } catch (error) {
                  clearSession()
                  notification.error({
                    message: 'Login failed',
                    description: getApiErrorMessage(error),
                  })
                }
              }}
            />
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
