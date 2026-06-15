import { Link } from 'react-router-dom'

export function LandingNav() {
  return (
    <nav className="landing-nav">
      <span className="landing-logo">ALRSCRM</span>
      <div className="landing-nav-actions">
        <Link to="/login" className="landing-btn-ghost">
          Login
        </Link>
        <a href="#early-access" className="landing-btn-primary">
          Join Early Access
        </a>
      </div>
    </nav>
  )
}
