import { useState } from 'react'
import { WaitlistForm } from '@/components/landing/WaitlistForm'

export function EarlyAccessSection() {
  const [submitted, setSubmitted] = useState(false)

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
          <WaitlistForm onSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </section>
  )
}
