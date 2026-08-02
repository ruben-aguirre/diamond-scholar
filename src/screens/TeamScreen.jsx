import { useState } from 'react';
import { battingAverage, playerAverage } from '../data/players';

// Upgrading a player costs this many coins and raises ONE skill of the kid's
// choice by 1 (batting, pitching, fielding, or running/speed). Skills cap at 10.
const UPGRADE_COST = 500;
const UPGRADE_TOKEN_COST = 2;  // tokens (earned from 5-in-a-row science streaks)

// Selling a player pays 50 coins for a good player, 30 for the rest.
// "Good" = overall rating (average of the four skills) of 4.5 or better.
const MIN_ROSTER = 9;  // can't sell below a full lineup
function sellPrice(player) {
  return playerAverage(player) >= 4.5 ? 50 : 30;
}
const UPGRADE_SKILLS = [
  { key: 'batting', label: 'Batting', icon: '\u{1F3CF}' },   // cricket bat+ball reads as "bat"
  { key: 'speed', label: 'Running', icon: '\u{1F3C3}' },
  { key: 'fielding', label: 'Fielding', icon: '\u{1F9E4}' }, // glove
  { key: 'pitching', label: 'Pitching', icon: '⚾' },
];

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
  // Player currently in the upgrade dialog (null = dialog closed).
  const [upgradingId, setUpgradingId] = useState(null);
  // Player currently in the sell dialog (null = dialog closed).
  const [sellingId, setSellingId] = useState(null);

  // Pay for upgrades with coins OR tokens (2 tokens = 1 free upgrade).
  const [payWith, setPayWith] = useState('coins');

  const upgradingPlayer = profile.roster.find((p) => p.id === upgradingId) || null;
  const tokens = profile.tokens || 0;
  const canAffordCoins = profile.coins >= UPGRADE_COST;
  const canAffordTokens = tokens >= UPGRADE_TOKEN_COST;
  const canAfford = payWith === 'tokens' ? canAffordTokens : canAffordCoins;

  // Open the upgrade dialog, defaulting to whichever currency he can afford.
  function openUpgrade(playerId) {
    setPayWith(canAffordCoins || !canAffordTokens ? 'coins' : 'tokens');
    setUpgradingId(playerId);
  }
  const sellingPlayer = profile.roster.find((p) => p.id === sellingId) || null;
  const canSell = profile.roster.length > MIN_ROSTER;

  // YES on the sell dialog: player leaves the team, coins come in. The
  // player also comes out of the batting order (their slot disappears) and
  // their field position opens up.
  function confirmSell() {
    if (!sellingPlayer || !canSell) return;
    const price = sellPrice(sellingPlayer);
    const newRoster = profile.roster.filter((p) => p.id !== sellingPlayer.id);
    const newLineup = (profile.lineup || []).filter((id) => id !== sellingPlayer.id);
    onUpdateProfile({
      roster: newRoster,
      lineup: newLineup,
      coins: profile.coins + price,
    });
    setSellingId(null);
  }

  // Spend the coins and raise the chosen skill by 1. Closes the dialog so the
  // kid sees the new number on the row right away.
  function upgradeSkill(skillKey) {
    if (!upgradingPlayer || !canAfford) return;
    if (upgradingPlayer[skillKey] >= 10) return;
    const newRoster = profile.roster.map((p) =>
      p.id === upgradingPlayer.id ? { ...p, [skillKey]: p[skillKey] + 1 } : p
    );
    const payment = payWith === 'tokens'
      ? { tokens: tokens - UPGRADE_TOKEN_COST }
      : { coins: profile.coins - UPGRADE_COST };
    onUpdateProfile({ roster: newRoster, ...payment });
    setUpgradingId(null);
  }

  // Look up the player for each batting-order slot.
  const battingOrder = (profile.lineup || []).map((id) =>
    profile.roster.find((p) => p.id === id) || null
  );

  // Which player is standing at each position right now.
  function playerAt(pos) {
    return profile.roster.find((p) => p.position === pos) || null;
  }

  // Tap a spot (or a bench player): first tap selects, second tap swaps.
  // Tapping the same one again cancels. Selections are either a position
  // string ('CF') or a bench player ('bench:<id>'). Swapping with the bench
  // sends the displaced fielder to the bench (position null).
  function tapSpot(sel) {
    if (swapFrom === null) {
      setSwapFrom(sel);
      return;
    }
    if (swapFrom === sel) {
      setSwapFrom(null);
      return;
    }
    const isBench = (s) => s.startsWith('bench:');
    const getPlayer = (s) =>
      isBench(s) ? profile.roster.find((p) => p.id === s.slice(6)) : playerAt(s);
    const posOf = (s) => (isBench(s) ? null : s);
    const a = getPlayer(swapFrom);
    const b = getPlayer(sel);
    const posA = posOf(swapFrom);
    const posB = posOf(sel);
    const newRoster = profile.roster.map((p) => {
      if (a && p.id === a.id) return { ...p, position: posB };
      if (b && p.id === b.id) return { ...p, position: posA };
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
          <span className="coin-icon" style={{ marginLeft: 10 }}>🎟️</span>
          <span className="coin-amount">{profile.tokens || 0}</span>
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
            {profile.roster.some((p) => !p.position) && (
              <div className="bench-row">
                <span className="bench-label">Bench:</span>
                {profile.roster.filter((p) => !p.position).map((p) => (
                  <button
                    key={p.id}
                    className={`bench-chip ${swapFrom === `bench:${p.id}` ? 'selected' : ''}`}
                    onClick={() => tapSpot(`bench:${p.id}`)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
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
                  <button
                    className="btn-upgrade"
                    onClick={() => openUpgrade(player.id)}
                  >
                    Upgrade
                  </button>
                  <button
                    className="btn-sell"
                    onClick={() => setSellingId(player.id)}
                  >
                    Sell
                  </button>
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

      {upgradingPlayer && (
        <div className="exit-dialog-backdrop" onClick={() => setUpgradingId(null)}>
          <div className="exit-dialog upgrade-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="exit-dialog-title">Upgrade {upgradingPlayer.name}</h2>
            <p className="exit-dialog-text">
              Pick ONE skill to make better. Pay with coins or tokens:
            </p>
            <div className="pay-toggle">
              <button
                className={`pay-option ${payWith === 'coins' ? 'active' : ''}`}
                onClick={() => setPayWith('coins')}
              >
                &#x1FA99; {UPGRADE_COST} coins
              </button>
              <button
                className={`pay-option ${payWith === 'tokens' ? 'active' : ''}`}
                onClick={() => setPayWith('tokens')}
              >
                🎟️ {UPGRADE_TOKEN_COST} tokens (you have {tokens})
              </button>
            </div>
            {!canAfford && (
              <p className="upgrade-no-coins">
                {payWith === 'tokens'
                  ? `You need ${UPGRADE_TOKEN_COST - tokens} more token${UPGRADE_TOKEN_COST - tokens === 1 ? '' : 's'}. Get 5 science answers right in a row to earn one!`
                  : `You need ${UPGRADE_COST - profile.coins} more coins. Win games to earn them!`}
              </p>
            )}
            <div className="upgrade-skill-list">
              {UPGRADE_SKILLS.map((skill) => {
                const current = upgradingPlayer[skill.key];
                const maxed = current >= 10;
                return (
                  <button
                    key={skill.key}
                    className="upgrade-skill-btn"
                    disabled={!canAfford || maxed}
                    onClick={() => upgradeSkill(skill.key)}
                  >
                    <span className="upgrade-skill-icon">{skill.icon}</span>
                    <span className="upgrade-skill-label">{skill.label}</span>
                    <span className="upgrade-skill-change">
                      {maxed ? 'MAX' : `${current} → ${current + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
            <button className="btn-exit-close upgrade-cancel" onClick={() => setUpgradingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sellingPlayer && (
        <div className="exit-dialog-backdrop" onClick={() => setSellingId(null)}>
          <div className="exit-dialog upgrade-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="exit-dialog-title">Sell {sellingPlayer.name}?</h2>
            {canSell ? (
              <p className="exit-dialog-text">
                Do you want to sell your player? You get{' '}
                <strong>&#x1FA99; {sellPrice(sellingPlayer)}</strong> coins, but{' '}
                {sellingPlayer.name} leaves the team forever.
              </p>
            ) : (
              <p className="upgrade-no-coins">
                You can't sell right now — you need at least {MIN_ROSTER} players
                on your team. Buy a new player in the Shop first!
              </p>
            )}
            <div className="exit-dialog-buttons">
              <button
                className="btn-exit-save"
                disabled={!canSell}
                onClick={confirmSell}
              >
                Yes
              </button>
              <button className="btn-exit-close" onClick={() => setSellingId(null)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
