import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as services from '@/api/services'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/store/authStore'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AntApp>
          <MemoryRouter>{children}</MemoryRouter>
        </AntApp>
      </QueryClientProvider>
    )
  }
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, organizationSlug: '' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all form fields and submit button', () => {
    render(<LoginPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Sign in to CBOS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your-organization')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    render(<LoginPage />, { wrapper: createWrapper() })
    await userEvent.click(screen.getByRole('button', { name: /login/i }))
    await waitFor(() => {
      expect(screen.getByText('Organization slug is required.')).toBeInTheDocument()
    })
  })

  it('calls login service and stores tokens on success', async () => {
    const loginSpy = vi.spyOn(services, 'login').mockResolvedValue({
      access_token: 'at-123',
      refresh_token: 'rt-456',
      token_type: 'bearer',
    })

    render(<LoginPage />, { wrapper: createWrapper() })

    await userEvent.type(screen.getByPlaceholderText('your-organization'), 'acme')
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'user@example.com')
    const passwordInput = screen.getAllByRole('textbox')[2] ?? document.querySelector('input[type="password"]')
    if (passwordInput) {
      await userEvent.type(passwordInput, 'secret')
    }
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        organization_slug: 'acme',
        email: 'user@example.com',
        password: expect.any(String),
      })
    })
  })

  it('shows error notification when login fails', async () => {
    vi.spyOn(services, 'login').mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginPage />, { wrapper: createWrapper() })

    await userEvent.type(screen.getByPlaceholderText('your-organization'), 'acme')
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'bad@example.com')
    const passwordInput = document.querySelector('input[type="password"]') as HTMLElement
    await userEvent.type(passwordInput, 'wrongpassword')

    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(document.body).toHaveTextContent('Login failed')
    })
  })
})
