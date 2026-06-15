import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as services from '@/api/services'
import { WaitlistForm } from '@/components/landing/WaitlistForm'

const mockSignupResponse: services.WaitlistSignupResponse = {
  id: 'abc-123',
  name: 'Ravi Kumar',
  email: 'ravi@example.com',
  phone: '+91 98765 43210',
  studio_name: null,
  city: null,
  photography_type: null,
  monthly_bookings: null,
  current_tools: null,
  biggest_problem: null,
  status: 'new',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('WaitlistForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all required fields', () => {
    render(<WaitlistForm />)
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/WhatsApp Number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Request Early Access/i })).toBeInTheDocument()
  })

  it('renders optional fields', () => {
    render(<WaitlistForm />)
    expect(screen.getByLabelText(/Studio Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Photography Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Monthly Bookings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Biggest Problem/i)).toBeInTheDocument()
  })

  it('calls onSuccess after successful submission', async () => {
    const onSuccess = vi.fn()
    vi.spyOn(services, 'submitWaitlistSignup').mockResolvedValue(mockSignupResponse)

    render(<WaitlistForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/Your Name/i), 'Ravi Kumar')
    await userEvent.type(screen.getByLabelText(/Email/i), 'ravi@example.com')
    await userEvent.type(screen.getByLabelText(/WhatsApp Number/i), '+91 98765 43210')
    await userEvent.click(screen.getByRole('button', { name: /Request Early Access/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
  })

  it('calls submitWaitlistSignup with correct payload', async () => {
    const spy = vi.spyOn(services, 'submitWaitlistSignup').mockResolvedValue(mockSignupResponse)

    render(<WaitlistForm />)

    await userEvent.type(screen.getByLabelText(/Your Name/i), 'Priya Sharma')
    await userEvent.type(screen.getByLabelText(/Email/i), 'priya@example.com')
    await userEvent.type(screen.getByLabelText(/WhatsApp Number/i), '+91 91234 56789')
    await userEvent.type(screen.getByLabelText(/Studio Name/i), 'Priya Studio')
    await userEvent.click(screen.getByRole('button', { name: /Request Early Access/i }))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+91 91234 56789',
          studio_name: 'Priya Studio',
        }),
      )
    })
  })

  it('shows error message on API failure', async () => {
    vi.spyOn(services, 'submitWaitlistSignup').mockRejectedValue(
      new Error('Email already on the waitlist.'),
    )

    render(<WaitlistForm />)

    await userEvent.type(screen.getByLabelText(/Your Name/i), 'Ravi Kumar')
    await userEvent.type(screen.getByLabelText(/Email/i), 'duplicate@example.com')
    await userEvent.type(screen.getByLabelText(/WhatsApp Number/i), '+91 98765 43210')
    await userEvent.click(screen.getByRole('button', { name: /Request Early Access/i }))

    await waitFor(() => {
      expect(screen.getByText(/Email already on the waitlist/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    let resolveSubmit!: () => void
    vi.spyOn(services, 'submitWaitlistSignup').mockReturnValue(
      new Promise<services.WaitlistSignupResponse>((resolve) => {
        resolveSubmit = () => resolve(mockSignupResponse)
      }),
    )

    render(<WaitlistForm />)

    await userEvent.type(screen.getByLabelText(/Your Name/i), 'Ravi Kumar')
    await userEvent.type(screen.getByLabelText(/Email/i), 'ravi@example.com')
    await userEvent.type(screen.getByLabelText(/WhatsApp Number/i), '+91 98765 43210')

    const button = screen.getByRole('button', { name: /Request Early Access/i })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    resolveSubmit()
    await waitFor(() => expect(button).not.toBeDisabled())
  })
})
