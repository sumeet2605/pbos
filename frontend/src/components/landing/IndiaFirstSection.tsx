const highlights = [
  { icon: '🇮🇳', title: 'INR Pricing', description: 'Packages and invoices in Indian Rupees, no conversion friction.' },
  { icon: '🧾', title: 'GST Invoicing', description: 'Generate GST-compliant invoices with GSTIN support built in.' },
  {
    icon: '🗓️',
    title: 'Festival Calendar',
    description: 'Shoot calendar aware of Indian festivals, muhurat dates and regional holidays.',
  },
  {
    icon: '📞',
    title: 'Indian Phone Formats',
    description: 'Works seamlessly with +91 numbers, regional names and local studio workflows.',
  },
]

export function IndiaFirstSection() {
  return (
    <section className="landing-section landing-india-section">
      <div className="landing-container">
        <div className="landing-india-badge">🇮🇳 India-First</div>
        <h2 className="landing-h2">Built for Bharat</h2>
        <p className="landing-section-sub">
          Not a foreign SaaS retrofitted for India — built here, for the way Indian studios operate.
        </p>
        <div className="landing-india-grid">
          {highlights.map((h) => (
            <div key={h.title} className="landing-india-card">
              <span className="landing-india-icon">{h.icon}</span>
              <h3 className="landing-india-title">{h.title}</h3>
              <p className="landing-india-desc">{h.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
