const plans = [
  {
    name: 'Solo Studio',
    price: '₹999',
    period: '/ month',
    description: 'Perfect for individual photographers managing their own clients.',
    features: ['Unlimited enquiries', 'WhatsApp follow-ups', 'GST invoicing', 'Gallery delivery links'],
    highlight: false,
  },
  {
    name: 'Studio Pro',
    price: '₹2,499',
    period: '/ month',
    description: 'For growing studios with multiple photographers and genres.',
    features: [
      'Everything in Solo',
      'Multi-photographer support',
      'Advanced pipeline views',
      'Priority support',
      'Festival calendar',
    ],
    highlight: true,
  },
]

export function PricingSection() {
  return (
    <section className="landing-section landing-section-alt">
      <div className="landing-container">
        <h2 className="landing-h2">Simple, Transparent Pricing</h2>
        <p className="landing-section-sub">Early access members get 3 months free on launch.</p>
        <div className="landing-pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`landing-pricing-card${plan.highlight ? ' landing-pricing-highlight' : ''}`}>
              {plan.highlight && <div className="landing-pricing-badge">Most Popular</div>}
              <h3 className="landing-pricing-name">{plan.name}</h3>
              <div className="landing-pricing-price">
                <span className="landing-pricing-amount">{plan.price}</span>
                <span className="landing-pricing-period">{plan.period}</span>
              </div>
              <p className="landing-pricing-desc">{plan.description}</p>
              <ul className="landing-pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <a href="#early-access" className={plan.highlight ? 'landing-btn-primary' : 'landing-btn-ghost'}>
                Join Early Access
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
