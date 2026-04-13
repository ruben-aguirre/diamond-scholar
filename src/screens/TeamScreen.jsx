const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

export default function TeamScreen({ profile, onBack }) {
  const starters = POSITIONS.map((pos) => {
    return profile.roster.find((p) => p.position === pos) || null;
  });

  return (
    <div className="team-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack}>&#8592;</button>
        <h1>The {profile.teamName}</h1>
        <div className="coin-display">
          <span className="coin-icon">&#x1FA99;</span>
          <span className="coin-amount">{profile.coins}</span>
        </div>
      </header>

      <div className="team-content">
        <h2 className="section-title">Starting Lineup</h2>
        <div className="lineup-list">
          {starters.map((player, i) => (
            <div key={POSITIONS[i]} className="lineup-row">
              <span className="lineup-pos">{POSITIONS[i]}</span>
              {player ? (
                <>
                  <span className="lineup-name">{player.name}</span>
                  <div className="stat-pills">
                    <span className="stat-pill" title="Batting">B:{player.batting}</span>
                    <span className="stat-pill" title="Pitching">P:{player.pitching}</span>
                    <span className="stat-pill" title="Fielding">F:{player.fielding}</span>
                    <span className="stat-pill" title="Speed">S:{player.speed}</span>
                  </div>
                </>
              ) : (
                <span className="lineup-empty">Empty</span>
              )}
            </div>
          ))}
        </div>

        <h2 className="section-title">Team Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{profile.stats.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile.stats.gamesWon}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile.stats.totalCoinsEarned}</span>
            <span className="stat-label">Total Coins</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {profile.stats.questionsTotal > 0
                ? Math.round((profile.stats.questionsCorrect / profile.stats.questionsTotal) * 100) + '%'
                : '--'}
            </span>
            <span className="stat-label">Quiz Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
