import { useState } from 'react';
import { battingAverage } from '../data/players';

// The 9 fielding positions, placed on a mini diamond. left/top are percentages
// of the field box so it scales on any screen. Order is a normal scorecard.
const FIELD_SPOTS = [
  { pos: 'P',  label: 'Pitcher',      left: 50, top: 58 },
  { pos: 'C',  label: 'Catcher',      left: 50, top: 90 },
  { pos: '1B', label: 'First Base',   left: 72, top: 55 },
  { pos: '2B', label: 'Second Base',  left: 61, top: 40 },
  { pos: '3B', label: 'Third Base',   left: 28, top: 55 },
  { pos: 'SS', label: 'Shortstop',    left: 39, top: 40 },
  { pos: 'LF', label: 'Left Field',   left: 20, top: 20 },
  { pos: 'CF', label: 'Center Field', left: 50, top: 12 },
  { pos: 'RF', label: 'Right Field',  left: 80, top: 20 },
];

export default function TeamScreen({ profile, onUpdateProfile, onBack }) {
  const [view, setView] = useState('batting'); // 'batting' | 'fielders'
  // On the field view, the first player you tap (to swap with a second tap).
  const [swapFrom, setSwapFrom] = useState(null);

  // Look up the player for each batting-order slot.
  const battingOrder = (profile.lineup || []).map((id) =>
    profile.roster.find((p) => p.id === id) || null
  );

  // Which player is standing at each position right now.
  function playerAt(pos) {
    return profile.roster.find((p) => p.position === pos) || null;
  }

  // Tap a spot: first tap selects it, second tap swaps the two players'
  // positions. Tapping the same spot again cancels.
  function tapSpot(pos) {
    if (swapFrom === null) {
      setSwapFrom(pos);
      return;
    }
    if (swapFrom === pos) {
      setSwapFrom(null);
      return;
    }
    const a = playerAt(swapFrom);
    const b = playerAt(pos);
    const newRoster = profile.roster.map((p) => {
      if (a && p.id === a.id) return { ...p, position: pos };
      if (b && p.id === b.id) return { ...p, position: swapFrom };
      return p;
    });
    onUpdateProfile({ roster: newRoster });
    setSwapFrom(null);
  }

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
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'batting' ? 'active' : ''}`}
            onClick={() => { setView('batting'); setSwapFrom(null); }}
          >
            Batting Order
          </button>
          <button
            className={`toggle-btn ${view === 'fielders' ? 'active' : ''}`}
            onClick={() => { setView('fielders'); setSwapFrom(null); }}
          >
            Fielders
          </button>
        </div>

        {view === 'fielders' && (
          <div className="fielders-view">
            <p className="section-help">
              Tap a player, then tap another to swap their positions.
            </p>
            <div className="mini-field">
              {FIELD_SPOTS.map((spot) => {
                const player = playerAt(spot.pos);
                const selected = swapFrom === spot.pos;
                return (
                  <button
                    key={spot.pos}
                    className={`field-spot ${selected ? 'selected' : ''}`}
                    style={{ left: `${spot.left}%`, top: `${spot.top}%` }}
                    onClick={() => tapSpot(spot.pos)}
                  >
                    <span className="spot-pos">{spot.pos}</span>
                    <span className="spot-name">{player ? player.name : 'Empty'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'batting' && (
        <div className="batting-view">
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
                  <span className="batting-avg" title="Batting average — hits divided by at-bats">
                    {battingAverage(player)}
                  </span>
                  <span className="batting-stat" title="Batting power (1-10)">BAT {player.batting}</span>
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
        </div>
        )}

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
