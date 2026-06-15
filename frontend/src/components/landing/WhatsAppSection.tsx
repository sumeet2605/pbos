const features = [
  {
    icon: '💬',
    title: 'WhatsApp-First Follow-ups',
    description:
      'Automated WhatsApp messages for enquiry confirmations, shoot day reminders and delivery updates — the channel your clients already use.',
  },
  {
    icon: '📸',
    title: 'Instagram Lead Capture',
    description:
      'Log enquiries from Instagram DMs into your pipeline without losing context. No more copy-pasting into spreadsheets.',
  },
]

export function WhatsAppSection() {
  return (
    <section className="landing-section landing-section-alt">
      <div className="landing-container">
        <h2 className="landing-h2">Meet Clients Where They Are</h2>
        <p className="landing-section-sub">
          90% of Indian clients prefer WhatsApp. ALRSCRM is designed around that reality.
        </p>
        <div className="landing-feature-grid">
          {features.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
