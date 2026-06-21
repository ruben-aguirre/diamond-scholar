import { playerAverage } from '../data/players';

export default function TeamScreen({ profile, onUpdateProfile, onBack }) {
  // Look up the player for each batting-order slot.
  const battingOrder = (profile.lineup || []).map((id) =>
    profile.roster.find((p) => p.id === id) || null
  );

  function moveUp(i) {
    if (i === 0) return;  // top of the order — can't go higher
    const newLineup = [...profile.lineup];
    [newLineup[i - 1], newLineup[i]] = [newLineup[i], newLineup[i - 1]];
    onUpdateProfile({ lineup: newLineup });
  }

  function moveDown(i) {
    if (i === battingOrder.length - 1) return;  // bottom of the order
    const newLineup = [...profile.lineup];
    [newLineup[i + 1], newLineup[i]] = [newLineup[i], newLineup[i + 1]];
    onUpdateProfile({ lineup: newLineup });
  }

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
        <h2 className="section-title">Batting Order</h2>
        <p className="section-help">
          Use the arrows to move players up or down. The player at the top bats first!
        </p>
        <div className="batting-order-list">
          {battingOrder.map((player, i) => (
            <div key={(player && player.id) || `slot-${i}`} className="batting-order-row">
              <span className="batting-pos">{i + 1}</span>
              {player ? (
                <>
                  <span className="batting-name">{player.name}</span>
                  <span className="batting-avg" title="Overall average of all four stats">
                    AVG {playerAverage(player)}
                  </span>
                  <span className="batting-stat" title="Batting">BAT {player.batting}</span>
                </>
              ) : (
                <span className="batting-empty">Empty</span>
              )}
              <div className="batting-move-buttons">
                <button
                  className="btn-move"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label="Move up"
                >
                  &#9650;
                </button>
                <button
                  className="btn-move"
                  onClick={() => moveDown(i)}
                  disabled={i === battingOrder.length - 1}
                  aria-label="Move down"
                >
                  &#9660;
                </button>
              </div>
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
