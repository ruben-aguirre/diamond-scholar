import { useRef, useState } from 'react';
import { canClaimSeasonalPack, claimSeasonalPack } from '../game/seasons';
import { MAX_TEAM, getPendingPack, purchasePack, resolvePackChoice } from '../game/cardPacks';
import {
  packPrices,
  playerAverage,
} from '../data/players';

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

export default function ShopScreen({ profile, onUpdateProfile, onBack, season }) {
  // Paid and free cards survive refreshing until the player chooses.
  const [reveal, setReveal] = useState(() => getPendingPack(profile));
  const [flipped, setFlipped] = useState(Boolean(getPendingPack(profile)));
  const openingGift = useRef(false);
  const settlingPack = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [choosingReplacement, setChoosingReplacement] = useState(false);
  // swap: when the team is full, which old player is selected to maybe replace.
  const [swapPick, setSwapPick] = useState(null);

  const teamFull = profile.roster.length >= MAX_TEAM;

  function openSeasonalPack() {
    if (openingGift.current || reveal) return;
    const gift = claimSeasonalPack(profile, season);
    if (!gift) return;
    openingGift.current = true;
    settlingPack.current = false;
    onUpdateProfile(gift);
    setError('');
    setNotice('');
    setFlipped(false);
    setSwapPick(null);
    setReveal(gift.seasonalPackReveal);
    setTimeout(() => setFlipped(true), 400);
  }

  function buyPack(pack, currency = 'coins') {
    if (openingGift.current || reveal) return;
    const cost = currency === 'tokens' ? packPrices[pack.tier].tokenCost : packPrices[pack.tier].cost;
    if ((profile[currency] || 0) < cost) {
      setError(`Not enough ${currency} for the ${pack.label}. You need ${cost}.`);
      return;
    }
    const purchase = purchasePack(profile, pack.tier, currency);
    if (!purchase) return;
    openingGift.current = true;
    settlingPack.current = false;
    setError('');
    setNotice('');
    onUpdateProfile(purchase);
    setFlipped(false);
    setSwapPick(null);
    setReveal(purchase.shopPackReveal);
    setTimeout(() => setFlipped(true), 400);
  }

  function chooseCard(keep) {
    if (!reveal || settlingPack.current || !flipped) return;
    if (keep && teamFull && !choosingReplacement) {
      setChoosingReplacement(true);
      return;
    }
    const updates = resolvePackChoice(profile, reveal.player.id, keep, swapPick);
    if (!updates) return;
    settlingPack.current = true;
    onUpdateProfile(updates);
    setNotice(keep
      ? `${reveal.player.name} joined your team!`
      : reveal.cost > 0
        ? `${reveal.cost} ${reveal.currency || 'coins'} returned. You didn't keep the player.`
        : 'You didn’t keep the player. Your free pack has been used.');
    openingGift.current = false;
    setReveal(null);
    setFlipped(false);
    setSwapPick(null);
    setChoosingReplacement(false);
  }

  return (
    <div className="shop-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack}>&#8592;</button>
        <h1>Card Shop</h1>
        <div className="coin-display">
          <span className="coin-icon">&#x1FA99;</span>
          <span className="coin-amount">{profile.coins}</span>
          <span className="coin-icon" aria-label="Tokens">🎟️</span>
          <span className="coin-amount">{profile.tokens || 0}</span>
        </div>
      </header>

      <div className="shop-content">
        {canClaimSeasonalPack(profile, season) && (
          <section className="holiday-gift">
            <span className="holiday-gift-icon" aria-hidden="true">🎁</span>
            <div><strong>Your {season.name} gift</strong><p>One free Gold Pack, just for you!</p></div>
            <button className="btn" onClick={openSeasonalPack}>Open free Gold Pack</button>
          </section>
        )}
        <p className="section-help">
          Buy a pack to get a new player for your team. Fancier packs cost more coins
          but give better players!
        </p>
        <p className="section-help">
          Your team: {profile.roster.length} / {MAX_TEAM} players.
        </p>

        {error && <p className="shop-error">{error}</p>}
        {notice && <p className="shop-choice-notice" role="status">{notice}</p>}

        <div className="pack-grid">
          {PACKS.map((pack) => {
            const cost = packPrices[pack.tier].cost;
            const tokenCost = packPrices[pack.tier].tokenCost;
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
                  <span className="coin-icon" aria-hidden="true">&#x1FA99;</span> {cost.toLocaleString('en-US')} coins
                </button>
                {tokenCost != null && (
                  <>
                    <span className="pack-payment-or">or</span>
                    <button
                      className="btn btn-buy btn-buy-tokens"
                      onClick={() => buyPack(pack, 'tokens')}
                      disabled={(profile.tokens || 0) < tokenCost}
                    >
                      <span aria-hidden="true">🎟️</span> {tokenCost} tokens
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {reveal && (
        <div className="reveal-backdrop">
          <div className="reveal-panel" onClick={(e) => e.stopPropagation()}>
            <span className="reveal-title">Keep this player?</span>
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

            {choosingReplacement && (
              <div className="swap-area">
                <p className="swap-help">
                  Your team is full. Choose a teammate to replace with {reveal.player.name}.
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
              </div>
            )}
            <p className="pack-choice-help">
              {reveal.cost > 0
                ? `Don't Keep returns all ${reveal.cost} ${reveal.currency || 'coins'}.`
                : 'This pack was free. No coins were spent.'}
            </p>
            <div className="pack-choice-buttons">
              <button className="btn btn-primary" disabled={!flipped || (choosingReplacement && !swapPick)} onClick={() => chooseCard(true)}>Keep</button>
              <button className="btn btn-secondary" disabled={!flipped} onClick={() => chooseCard(false)}>Don’t Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
