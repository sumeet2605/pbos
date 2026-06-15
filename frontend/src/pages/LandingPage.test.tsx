import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  it('renders the hero headline', () => {
    renderLandingPage()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/Operating System/)
    expect(h1).toHaveTextContent(/for Indian Photographers/)
  })

  it('renders Join Early Access CTA buttons', () => {
    renderLandingPage()
    const ctaButtons = screen.getAllByRole('link', { name: /Join Early Access/i })
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Login link', () => {
    renderLandingPage()
    const loginLinks = screen.getAllByRole('link', { name: /Login/i })
    expect(loginLinks.length).toBeGreaterThanOrEqual(1)
    expect(loginLinks[0]).toHaveAttribute('href', '/login')
  })

  it('renders all genre sections', () => {
    renderLandingPage()
    expect(screen.getByText('Maternity')).toBeInTheDocument()
    expect(screen.getByText('Newborn')).toBeInTheDocument()
    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.getByText('Wedding')).toBeInTheDocument()
  })

  it('renders the early access form', () => {
    renderLandingPage()
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/WhatsApp Number/i)).toBeInTheDocument()
  })

  it('shows success state after form submission', async () => {
    renderLandingPage()
    await userEvent.type(screen.getByLabelText(/Your Name/i), 'Ravi Kumar')
    await userEvent.type(screen.getByLabelText(/WhatsApp Number/i), '+91 98765 43210')
    await userEvent.click(screen.getByRole('button', { name: /Request Early Access/i }))
    expect(await screen.findByText(/You are on the list/i)).toBeInTheDocument()
  })

  it('renders India-first section', () => {
    renderLandingPage()
    expect(screen.getByText(/Built for Bharat/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /GST Invoicing/i })).toBeInTheDocument()
  })

  it('renders How ALRSCRM Works section', () => {
    renderLandingPage()
    expect(screen.getByText(/How ALRSCRM Works/i)).toBeInTheDocument()
    expect(screen.getByText(/Capture Enquiry/i)).toBeInTheDocument()
  })
})
