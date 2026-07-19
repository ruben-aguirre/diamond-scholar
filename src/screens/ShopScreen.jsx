import { useState } from 'react';
import {
  packPrices,
  createPlayerFromPool,
  playerAverage,
} from '../data/players';

const MAX_TEAM = 12; // most players you can keep on the team

// The four packs, cheap-to-fancy so kids read them left to right.
const PACKS = [
  { tier: 'bronze', label: 'Bronze Pack', emoji: '🥉', color: '#cd7f32', blurb: 'Good players' },
  { tier: 'silver', label: 'Silver Pack', emoji: '🥈', color: '#9fb3c8', blurb: 'Better players' },
  { tier: 'gold', label: 'Gold Pack', emoji: '🥇', color: '#e8b23a', blurb: 'Great players' },
  { tier: 'diamond', label: 'Diamond Pack', emoji: '💎', color: '#4fc3f7', blurb: 'The very best' },
];

const TIER_COLOR = {
  bronze: '#cd7f32',
  silver: '#9fb3c8',
  gold: '#e8b23a',
  diamond: '#4fc3f7',
};

export default function ShopScreen({ profile, onUpdateProfile, onBack }) {
  // reveal: the card just pulled ({ player, tier }); null when no pack is open.
  const [reveal, setReveal] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState('');
  // swap: when the team is full, which old player is selected to maybe replace.
  const [swapPick, setSwapPick] = useState(null);

  const teamFull = profile.roster.length >= MAX_TEAM;

  function buyPack(pack) {
    const cost = packPrices[pack.tier].cost;
    if (profile.coins < cost) {
      setError(`Not enough coins for the ${pack.label}. You need ${cost}.`);
      return;
    }
    setError('');
    // Spend the coins, but DON'T add the player yet — the player only joins
    // when you tap "Add to Team" (or swap them in when the team is full).
    const ownedNames = profile.roster.map((p) => p.name);
    const newPlayer = createPlayerFromPool(pack.tier, ownedNames);
    onUpdateProfile({ coins: profile.coins - cost });
    setFlipped(false);
    setSwapPick(null);
    setReveal({ player: newPlayer, tier: pack.tier });
    setTimeout(() => setFlipped(true), 400);
  }

  // Room on the team → just add the new player.
  function addToTeam() {
    onUpdateProfile({ roster: [...profile.roster, reveal.player] });
    closeReveal();
  }

  // Team full → replace the picked old player with the new card.
  function getRidOf(oldPlayer) {
    const newRoster = profile.roster.map((p) =>
      p.id === oldPlayer.id ? reveal.player : p
    );
    // If the dropped player was in the batting lineup, put the new player in
    // that same spot so the lineup stays full.
    const newLineup = (profile.lineup || []).map((id) =>
      id === oldPlayer.id ? reveal.player.id : id
    );
    onUpdateProfile({ roster: newRoster, lineup: newLineup });
    closeReveal();
  }

  // Team full → keep everyone, throw the new card away (coins already spent).
  function keepTeam() {
    closeReveal();
  }

  function closeReveal() {
    setReveal(null);
    setFlipped(false);
    setSwapPick(null);
  }

  return (
    <div className="shop-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack}>&#8592;</button>
        <h1>Card Shop</h1>
        <div className="coin-display">
          <span className="coin-icon">&#x1FA99;</span>
          <span className="coin-amount">{profile.coins}</span>
        </div>
      </header>

      <div className="shop-content">
        <p className="section-help">
          Buy a pack to get a new player for your team. Fancier packs cost more coins
          but give better players!
        </p>
        <p className="section-help">
          Your team: {profile.roster.length} / {MAX_TEAM} players.
        </p>

        {error && <p className="shop-error">{error}</p>}

        <div className="pack-grid">
          {PACKS.map((pack) => {
            const cost = packPrices[pack.tier].cost;
            const canAfford = profile.coins >= cost;
            return (
              <div key={pack.tier} className="pack-card" style={{ borderColor: pack.color }}>
                <div className="pack-emoji" style={{ backgroundColor: pack.color }}>
                  {pack.emoji}
                </div>
                <span className="pack-label">{pack.label}</span>
                <span className="pack-blurb">{pack.blurb}</span>
                <button
                  className="btn btn-buy"
                  onClick={() => buyPack(pack)}
                  disabled={!canAfford}
                >
                  <span className="coin-icon">&#x1FA99;</span> {cost}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {reveal && (
        <div className="reveal-backdrop">
          <div className="reveal-panel" onClick={(e) => e.stopPropagation()}>
            <span className="reveal-title">You got a new player!</span>
            <div className={`reveal-card ${flipped ? 'flipped' : ''}`}>
              <div className="reveal-card-inner">
                <div className="reveal-card-back" style={{ backgroundColor: TIER_COLOR[reveal.tier] }}>
                  <span className="reveal-back-emoji">⚾</span>
                </div>
                <div className="reveal-card-front" style={{ borderColor: TIER_COLOR[reveal.tier] }}>
                  <span className="reveal-tier-badge" style={{ backgroundColor: TIER_COLOR[reveal.tier] }}>
                    {reveal.tier.toUpperCase()}
                  </span>
                  <span className="reveal-name">{reveal.player.name}</span>
                  <span className="reveal-overall">Overall {playerAverage(reveal.player)}</span>
                  <div className="reveal-stats">
                    <span>BAT {reveal.player.batting}</span>
                    <span>PIT {reveal.player.pitching}</span>
                    <span>FLD {reveal.player.fielding}</span>
                    <span>SPD {reveal.player.speed}</span>
                  </div>
                </div>
              </div>
            </div>

            {!teamFull ? (
              // Room on the team — simple add.
              <button className="btn btn-primary" onClick={addToTeam}>
                Add to Team
              </button>
            ) : (
              // Team is full — pick someone to get rid of, or keep your team.
              <div className="swap-area">
                <p className="swap-help">
                  Your team is full. Pick a player to get rid of, or keep your team.
                </p>
                <div className="swap-list">
                  {profile.roster.map((p) => (
                    <button
                      key={p.id}
                      className={`swap-row ${swapPick === p.id ? 'selected' : ''}`}
                      onClick={() => setSwapPick(p.id)}
                    >
                      <span className="swap-name">{p.name}</span>
                      <span className="swap-ovr">OVR {playerAverage(p)}</span>
                    </button>
                  ))}
                </div>
                <div className="swap-buttons">
                  <button className="btn btn-secondary" onClick={keepTeam}>
                    Keep My Team
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={!swapPick}
                    onClick={() =>
                      getRidOf(profile.roster.find((p) => p.id === swapPick))
                    }
                  >
                    Get Rid Of
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
