import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore'

export function PublicRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
