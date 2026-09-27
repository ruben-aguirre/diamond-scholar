export default function HomeScreen({ profile, onNavigate, onSwitchProfile }) {
  const menuItems = [
    { id: 'team', label: 'My Team', icon: '&#128101;', enabled: true, description: 'Set your lineup' },
    { id: 'batting-practice', label: 'Batting Practice', icon: '&#127951;', enabled: true, description: 'Time your swing' },
    { id: 'fielding-practice', label: 'Fielding Practice', icon: '&#129351;', enabled: true, description: 'Make the right throw' },
    { id: 'running-practice', label: 'Running Practice', icon: '&#127939;', enabled: true, description: 'Run the bases' },
    { id: 'shop', label: 'Card Shop', icon: '&#127183;', enabled: true, description: 'Open player packs' },
    { id: 'draft', label: 'Draft Day', icon: '&#128203;', enabled: true, description: 'Find a future star' },
  ];

  const gamesPlayed = profile.stats?.gamesPlayed || 0;
  const gamesWon = profile.stats?.gamesWon || 0;

  return (
    <div className="home-screen">
      <header className="home-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <div className="header-left">
          <span className="home-brand">DIAMOND SCHOLAR</span>
          <h1 className="team-name">The {profile.teamName}</h1>
          <span className="player-name">{profile.name}</span>
        </div>
        <div className="header-right">
          <div className="coin-display">
            <span className="coin-icon">&#x1FA99;</span>
            <span className="coin-amount">{profile.coins}</span>
            <span className="coin-icon" style={{ marginLeft: 10 }}>🎟️</span>
            <span className="coin-amount">{profile.tokens || 0}</span>
          </div>
        </div>
      </header>

      <div className="home-content">
        <section className="home-hero">
          <div className="home-hero-shade" />
          <div className="home-hero-copy">
            <span className="home-hero-kicker">&#9918; TODAY&apos;S GAME</span>
            <h2>Take the field,<br />{profile.name}!</h2>
            <p>Crush pitches, make great plays, and earn rewards with every right answer.</p>
            <button className="home-play-button" onClick={() => onNavigate('game')}>
              <span>PLAY BALL!</span>
              <span className="home-play-arrow">&#9654;</span>
            </button>
          </div>
          <div className="home-record-card">
            <span className="home-record-label">TEAM RECORD</span>
            <strong>{gamesWon} - {Math.max(0, gamesPlayed - gamesWon)}</strong>
            <span>{gamesPlayed === 0 ? 'Your season starts now!' : `${gamesPlayed} games played`}</span>
          </div>
        </section>

        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">YOUR CLUBHOUSE</span>
            <h2>What do you want to do?</h2>
          </div>
          <span className="home-section-ball" aria-hidden="true">&#9918;</span>
        </div>

        <div className="menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-card menu-card-${item.id} ${item.enabled ? '' : 'disabled'}`}
              onClick={() => item.enabled && onNavigate(item.id)}
              disabled={!item.enabled}
            >
              <span className="menu-icon-wrap">
                <span
                  className="menu-icon"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
              </span>
              <span className="menu-copy">
                <span className="menu-label">{item.label}</span>
                <span className="menu-description">{item.description}</span>
              </span>
              <span className="menu-arrow" aria-hidden="true">&#8250;</span>
              {!item.enabled && <span className="menu-badge">Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <footer className="home-footer">
        <button className="btn btn-small btn-secondary" onClick={onSwitchProfile}>
          Switch Player
        </button>
      </footer>
    </div>
  );
}
