import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-container">
        <div className="landing-badge">Built for Indian Photography Studios</div>
        <h1 className="landing-h1">
          The Operating System
          <br />
          <span className="landing-accent">for Indian Photographers</span>
        </h1>
        <p className="landing-subtext">
          Manage maternity, newborn, family and wedding enquiries — from WhatsApp to final delivery — in one
          studio-first platform. Made for India.
        </p>
        <div className="landing-cta-row">
          <a href="#early-access" className="landing-btn-primary landing-btn-lg">
            Join Early Access
          </a>
          <Link to="/login" className="landing-btn-ghost landing-btn-lg">
            Login to Studio
          </Link>
        </div>
      </div>
    </section>
  )
}
