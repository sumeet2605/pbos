const genres = [
  {
    icon: '🤰',
    genre: 'Maternity',
    description: 'Track session timelines, outfit change reminders, and delivery workflows for expecting parents.',
  },
  {
    icon: '👶',
    genre: 'Newborn',
    description: 'Manage delicate scheduling windows, parent callbacks and milestone gallery deliveries.',
  },
  {
    icon: '👨‍👩‍👧',
    genre: 'Family',
    description: 'Coordinate multi-member shoots, seasonal packages and repeat booking follow-ups.',
  },
  {
    icon: '💍',
    genre: 'Wedding',
    description: 'Handle multi-day events, vendor coordination, pre-wedding shoots and album delivery pipelines.',
  },
]

export function GenreWorkflowsSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <h2 className="landing-h2">Workflows for Every Genre</h2>
        <p className="landing-section-sub">Purpose-built for the photography you actually shoot.</p>
        <div className="landing-genre-grid">
          {genres.map((g) => (
            <div key={g.genre} className="landing-genre-card">
              <span className="landing-genre-icon">{g.icon}</span>
              <h3 className="landing-genre-title">{g.genre}</h3>
              <p className="landing-genre-desc">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
