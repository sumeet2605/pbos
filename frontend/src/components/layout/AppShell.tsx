import { useMemo, useState } from 'react'
import {
  AuditOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/api/services'
import { ErrorState, LoadingState } from '@/components/feedback/StateViews'
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery'
import { getApiErrorMessage } from '@/api/client'
import { getPageTitle, getSelectedNavKey } from '@/routes/navigation'
import { useAuthStore } from '@/store/authStore'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/clients',
    icon: <TeamOutlined />,
    label: 'Clients',
  },
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: 'Projects',
  },
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: 'Audit Events',
  },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const screens = useBreakpoint()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { token } = theme.useToken()
  const organizationSlug = useAuthStore((state) => state.organizationSlug)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const storedUser = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const { data: currentUser, isLoading, error, refetch } = useCurrentUserQuery()

  const user = currentUser ?? storedUser
  const selectedKey = useMemo(() => getSelectedNavKey(location.pathname), [location.pathname])
  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname])

  const handleNavigation = (key: string) => {
    navigate(key)
    setDrawerOpen(false)
  }

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await logout(refreshToken)
      } catch {
        // Always clear local session even if backend revocation request fails.
      }
    }
    clearSession()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  if (isLoading && !user) {
    return <LoadingState title="Loading workspace" />
  }

  if (error && !user) {
    return (
      <ErrorState
        title="Unable to load workspace"
        description={getApiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    )
  }

  const navigationMenu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ key }) => handleNavigation(key)}
      style={{ borderInlineEnd: 0 }}
    />
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {screens.lg ? (
        <Sider width={260} theme="light" style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}>
          <div style={{ padding: 24 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              CBOS
            </Typography.Title>
            <Typography.Text type="secondary">Sprint A workspace</Typography.Text>
          </div>
          {navigationMenu}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
          title="Navigation"
        >
          {navigationMenu}
        </Drawer>
      )}
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Space size="middle">
            {!screens.lg ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
              />
            ) : null}
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {pageTitle}
              </Typography.Title>
              <Typography.Text type="secondary">Operate within {organizationSlug || 'your organization'}</Typography.Text>
            </div>
          </Space>
          <Space size="middle" wrap>
            {organizationSlug ? <Tag color="blue">Org: {organizationSlug}</Tag> : null}
            <Space size="small">
              <Avatar>{user?.full_name?.charAt(0).toUpperCase() ?? 'U'}</Avatar>
              {screens.sm ? (
                <div style={{ lineHeight: 1.2 }}>
                  <Typography.Text strong>{user?.full_name}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">{user?.email}</Typography.Text>
                </div>
              ) : null}
            </Space>
            <Button icon={<LogoutOutlined />} onClick={() => void handleLogout()}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: screens.xs ? 16 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
