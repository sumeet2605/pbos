import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuditEventViewerPage } from '@/pages/AuditEventViewerPage'
import { ClientCreatePage } from '@/pages/ClientCreatePage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ClientEditPage } from '@/pages/ClientEditPage'
import { ClientsListPage } from '@/pages/ClientsListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProjectCreatePage } from '@/pages/ProjectCreatePage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ProjectEditPage } from '@/pages/ProjectEditPage'
import { ProjectsListPage } from '@/pages/ProjectsListPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'

export const router = createBrowserRouter([
  // Public landing page — no authentication required
  {
    path: '/',
    element: <LandingPage />,
  },
  // Public auth routes — redirect to /dashboard when already authenticated
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  // Protected app routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        errorElement: <NotFoundPage />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'clients', element: <ClientsListPage /> },
          { path: 'clients/new', element: <ClientCreatePage /> },
          { path: 'clients/:id', element: <ClientDetailPage /> },
          { path: 'clients/:id/edit', element: <ClientEditPage /> },
          { path: 'projects', element: <ProjectsListPage /> },
          { path: 'projects/new', element: <ProjectCreatePage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
          { path: 'projects/:id/edit', element: <ProjectEditPage /> },
          { path: 'audit', element: <AuditEventViewerPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
