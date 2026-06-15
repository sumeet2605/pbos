import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <div className="landing-footer-brand">
          <span className="landing-logo">ALRSCRM</span>
          <p className="landing-footer-tagline">The studio operating system for Indian photographers.</p>
        </div>
        <nav className="landing-footer-links" aria-label="Footer navigation">
          <Link to="/login">Login</Link>
          <a href="#early-access">Early Access</a>
          {/* TODO: Add Privacy Policy page when available */}
          <span className="landing-footer-link-disabled">Privacy Policy</span>
        </nav>
      </div>
      <div className="landing-footer-copy">
        <p>© {new Date().getFullYear()} ALRSCRM. All rights reserved.</p>
      </div>
    </footer>
  )
}
