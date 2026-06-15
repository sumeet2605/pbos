import { useState } from 'react'
import { submitWaitlistSignup, type WaitlistCreatePayload } from '@/api/services'

interface WaitlistFormProps {
  onSuccess?: () => void
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [form, setForm] = useState<WaitlistCreatePayload>({
    name: '',
    email: '',
    phone: '',
    studio_name: '',
    city: '',
    photography_type: '',
    monthly_bookings: '',
    biggest_problem: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload: WaitlistCreatePayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        studio_name: form.studio_name?.trim() || undefined,
        city: form.city?.trim() || undefined,
        photography_type: form.photography_type?.trim() || undefined,
        monthly_bookings: form.monthly_bookings?.trim() || undefined,
        biggest_problem: form.biggest_problem?.trim() || undefined,
      }
      await submitWaitlistSignup(payload)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="landing-ea-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="landing-ea-field">
        <label htmlFor="wl-name">Your Name *</label>
        <input
          id="wl-name"
          name="name"
          type="text"
          placeholder="Ravi Kumar"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-email">Email *</label>
        <input
          id="wl-email"
          name="email"
          type="email"
          placeholder="ravi@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-phone">WhatsApp Number *</label>
        <input
          id="wl-phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={handleChange}
          required
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-studio">Studio Name</label>
        <input
          id="wl-studio"
          name="studio_name"
          type="text"
          placeholder="Ravi Photography Studio"
          value={form.studio_name ?? ''}
          onChange={handleChange}
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-city">City</label>
        <input
          id="wl-city"
          name="city"
          type="text"
          placeholder="Mumbai"
          value={form.city ?? ''}
          onChange={handleChange}
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-type">Photography Type</label>
        <input
          id="wl-type"
          name="photography_type"
          type="text"
          placeholder="Wedding, Maternity, Newborn…"
          value={form.photography_type ?? ''}
          onChange={handleChange}
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-bookings">Monthly Bookings</label>
        <input
          id="wl-bookings"
          name="monthly_bookings"
          type="text"
          placeholder="e.g. 5–10"
          value={form.monthly_bookings ?? ''}
          onChange={handleChange}
        />
      </div>
      <div className="landing-ea-field">
        <label htmlFor="wl-problem">Biggest Problem</label>
        <textarea
          id="wl-problem"
          name="biggest_problem"
          placeholder="What is your biggest challenge managing bookings today?"
          value={form.biggest_problem ?? ''}
          onChange={handleChange}
          rows={3}
        />
      </div>
      {error && <p className="landing-ea-error">{error}</p>}
      <button type="submit" className="landing-btn-primary landing-ea-submit" disabled={loading}>
        {loading ? 'Submitting…' : '💬 Request Early Access on WhatsApp'}
      </button>
    </form>
  )
}
