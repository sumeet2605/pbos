const steps = [
  {
    step: '01',
    title: 'Capture Enquiry',
    description: 'Log incoming enquiries from WhatsApp, Instagram or walk-ins. No chat gets lost.',
  },
  {
    step: '02',
    title: 'Automate Follow-ups',
    description: 'Schedule WhatsApp reminders and follow-up messages. Convert more enquiries to bookings.',
  },
  {
    step: '03',
    title: 'Deliver & Invoice',
    description: 'Track shoot progress, share galleries, and send GST-compliant invoices — all from one place.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="landing-section landing-section-alt">
      <div className="landing-container">
        <h2 className="landing-h2">How ALRSCRM Works</h2>
        <p className="landing-section-sub">Three steps from enquiry to happy client.</p>
        <div className="landing-steps-grid">
          {steps.map((s) => (
            <div key={s.step} className="landing-step-card">
              <div className="landing-step-number">{s.step}</div>
              <h3 className="landing-step-title">{s.title}</h3>
              <p className="landing-step-desc">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
