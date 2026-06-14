import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/StateViews'

describe('LoadingState', () => {
  it('renders with default title', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<LoadingState title="Fetching clients" />)
    expect(screen.getByText('Fetching clients')).toBeInTheDocument()
  })

  it('renders default description', () => {
    render(<LoadingState />)
    expect(screen.getByText('Please wait while we load your data.')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('renders the description', () => {
    render(<ErrorState description="Something went wrong." />)
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  it('renders with default title', () => {
    render(<ErrorState description="error" />)
    expect(screen.getByText('Unable to load data')).toBeInTheDocument()
  })

  it('does not show Retry button when onRetry is omitted', () => {
    render(<ErrorState description="error" />)
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('calls onRetry when Retry button is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState description="error" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('EmptyState', () => {
  it('renders the description', () => {
    render(<EmptyState description="No records found." />)
    expect(screen.getByText('No records found.')).toBeInTheDocument()
  })
})
