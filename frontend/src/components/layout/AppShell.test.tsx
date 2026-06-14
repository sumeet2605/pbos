import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/authStore'

const { logout } = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('@/api/services', async () => {
  const actual = await vi.importActual<typeof import('@/api/services')>('@/api/services')
  return {
    ...actual,
    logout,
  }
})

vi.mock('@/hooks/useCurrentUserQuery', () => ({
  useCurrentUserQuery: () => ({
    data: {
      id: 'u1',
      email: 'user@example.com',
      full_name: 'Test User',
      organization_id: 'org-1',
      is_active: true,
      is_superuser: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="dashboard" element={<div>Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>
  )
}

describe('AppShell logout', () => {
  beforeEach(() => {
    logout.mockReset()
    useAuthStore.setState({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      organizationSlug: 'acme',
      user: null,
    })
  })

  it('revokes refresh token before clearing local session', async () => {
    logout.mockResolvedValue(undefined)
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(logout).toHaveBeenCalledWith('refresh-token')
    })
    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().refreshToken).toBeNull()
    })
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('clears local session even when logout API fails', async () => {
    logout.mockRejectedValue(new Error('network error'))
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(logout).toHaveBeenCalledWith('refresh-token')
    })
    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().refreshToken).toBeNull()
    })
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
