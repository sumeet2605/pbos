const painPoints = [
  { icon: '📱', text: 'WhatsApp enquiries getting buried in chats' },
  { icon: '📅', text: 'Missed follow-ups costing bookings' },
  { icon: '📊', text: 'Juggling spreadsheets for client data' },
  { icon: '🧾', text: 'Manual GST invoicing eating your evenings' },
  { icon: '😩', text: 'No visibility into shoot pipeline status' },
]

export function PainSection() {
  return (
    <section className="landing-pain">
      <div className="landing-container">
        <p className="landing-pain-heading">Sound familiar?</p>
        <div className="landing-pain-grid">
          {painPoints.map((p) => (
            <div key={p.text} className="landing-pain-card">
              <span className="landing-pain-icon">{p.icon}</span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
