import { useState } from 'react'

interface FormData {
  name: string
  studioName: string
  city: string
  whatsapp: string
}

const initialFormData: FormData = { name: '', studioName: '', city: '', whatsapp: '' }

// TODO: Replace with real API endpoint when backend /api/waitlist is available.
// Currently form submission is frontend-only — no data is persisted.
function submitWaitlistForm(_data: FormData): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 600))
}

export function EarlyAccessSection() {
  const [form, setForm] = useState<FormData>(initialFormData)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.whatsapp.trim()) return
    setLoading(true)
    try {
      await submitWaitlistForm(form)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="early-access" className="landing-section landing-ea-section">
      <div className="landing-container">
        <h2 className="landing-h2">Join the Early Access</h2>
        <p className="landing-section-sub">
          We are onboarding a limited set of photography studios. Leave your details and we will reach out on WhatsApp.
        </p>

        {submitted ? (
          <div className="landing-ea-success">
            <span className="landing-ea-success-icon">🎉</span>
            <h3>You are on the list!</h3>
            <p>We will reach out on WhatsApp soon. Thank you for your interest in ALRSCRM.</p>
          </div>
        ) : (
          <form className="landing-ea-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="landing-ea-field">
              <label htmlFor="ea-name">Your Name *</label>
              <input
                id="ea-name"
                name="name"
                type="text"
                placeholder="Ravi Kumar"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="landing-ea-field">
              <label htmlFor="ea-studio">Studio Name</label>
              <input
                id="ea-studio"
                name="studioName"
                type="text"
                placeholder="Ravi Photography Studio"
                value={form.studioName}
                onChange={handleChange}
              />
            </div>
            <div className="landing-ea-field">
              <label htmlFor="ea-city">City</label>
              <input
                id="ea-city"
                name="city"
                type="text"
                placeholder="Mumbai"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div className="landing-ea-field">
              <label htmlFor="ea-whatsapp">WhatsApp Number *</label>
              <input
                id="ea-whatsapp"
                name="whatsapp"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.whatsapp}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="landing-btn-primary landing-ea-submit" disabled={loading}>
              {loading ? 'Submitting…' : '💬 Request Early Access on WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
