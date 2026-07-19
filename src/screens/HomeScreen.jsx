export default function HomeScreen({ profile, onNavigate, onSwitchProfile }) {
  const menuItems = [
    { id: 'game', label: 'Play Ball!', icon: '&#9918;', enabled: true, description: 'Start a game' },
    { id: 'team', label: 'My Team', icon: '&#128101;', enabled: true, description: 'View roster & lineup' },
    { id: 'batting-practice', label: 'Batting Practice', icon: '&#127951;', enabled: false, description: 'Coming soon' },
    { id: 'fielding-practice', label: 'Fielding Practice', icon: '&#129351;', enabled: false, description: 'Coming soon' },
    { id: 'running-practice', label: 'Running Practice', icon: '&#127939;', enabled: false, description: 'Coming soon' },
    { id: 'shop', label: 'Card Shop', icon: '&#127183;', enabled: true, description: 'Buy player packs' },
  ];

  return (
    <div className="home-screen">
      <header className="home-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <div className="header-left">
          <h1 className="team-name">The {profile.teamName}</h1>
          <span className="player-name">{profile.name}</span>
        </div>
        <div className="header-right">
          <div className="coin-display">
            <span className="coin-icon">&#x1FA99;</span>
            <span className="coin-amount">{profile.coins}</span>
          </div>
        </div>
      </header>

      <div className="home-content">
        <div className="menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-card ${item.enabled ? '' : 'disabled'}`}
              onClick={() => item.enabled && onNavigate(item.id)}
              disabled={!item.enabled}
            >
              <span
                className="menu-icon"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              <span className="menu-label">{item.label}</span>
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
