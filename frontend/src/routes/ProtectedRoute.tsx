import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
