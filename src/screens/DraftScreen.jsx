import { useState } from 'react';
import {
  minorLeaguePool,
  DRAFT_COST,
  createPlayerId,
  playerAverage,
} from '../data/players';

const MAX_TEAM = 12; // same cap as the Card Shop

const CUSTOM_COST = 150;  // create-your-own-player price

// Secret name: type this (any capitals/spaces) and the custom player comes
// out maxed at 10 in batting, pitching, fielding, AND running. Shhh.
const SECRET_NAME = 'bebeoof';
function isSecretName(name) {
  return name.toLowerCase().replace(/\s+/g, '') === SECRET_NAME;
}

// Draft Day — the minor leagues. Unlike the Card Shop's mystery packs, here
// the kid SEES every prospect's stats and picks the one he wants. Each pick
// costs DRAFT_COST scholar coins. A prospect can only be drafted once (he
// leaves the board once he's on your team).
export default function DraftScreen({ profile, onUpdateProfile, onBack }) {
  const [error, setError] = useState('');
  // The prospect just drafted, for the "welcome to the team" confirmation.
  const [drafted, setDrafted] = useState(null);
  // Customize-player dialog open? And the name being typed.
  const [customizing, setCustomizing] = useState(false);
  const [customName, setCustomName] = useState('');

  const ownedNames = new Set(profile.roster.map((p) => p.name));
  const prospects = minorLeaguePool.filter((p) => !ownedNames.has(p.name));
  const teamFull = profile.roster.length >= MAX_TEAM;

  function draftPlayer(prospect) {
    if (teamFull) {
      setError('Your team is full! Sell a player in My Team to make room.');
      return;
    }
    if (profile.coins < DRAFT_COST) {
      setError(`Not enough coins. Drafting costs ${DRAFT_COST}.`);
      return;
    }
    setError('');
    const newPlayer = {
      id: createPlayerId(),
      ...prospect,
      tier: 'minors',
      position: null, // unassigned until placed on the field
    };
    onUpdateProfile({
      roster: [...profile.roster, newPlayer],
      coins: profile.coins - DRAFT_COST,
    });
    setDrafted(newPlayer);
  }

  // Create the custom player from the typed name. Normal names get solid
  // all-around stats (5s). The secret name gets everything maxed at 10.
  function createCustomPlayer() {
    const name = customName.trim();
    if (!name) return;
    if (teamFull) {
      setError('Your team is full! Sell a player in My Team to make room.');
      setCustomizing(false);
      return;
    }
    if (profile.coins < CUSTOM_COST) {
      setError(`Not enough coins. Customizing costs ${CUSTOM_COST}.`);
      setCustomizing(false);
      return;
    }
    setError('');
    const maxed = isSecretName(name);
    const stat = maxed ? 10 : 5;
    const newPlayer = {
      id: createPlayerId(),
      name,
      batting: stat,
      pitching: stat,
      fielding: stat,
      speed: stat,
      tier: 'custom',
      position: null,
    };
    onUpdateProfile({
      roster: [...profile.roster, newPlayer],
      coins: profile.coins - CUSTOM_COST,
    });
    setCustomizing(false);
    setCustomName('');
    setDrafted(newPlayer);
  }

  return (
    <div className="shop-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack}>&#8592;</button>
        <h1>Draft Day</h1>
        <div className="coin-display">
          <span className="coin-icon">&#x1FA99;</span>
          <span className="coin-amount">{profile.coins}</span>
        </div>
      </header>

      <div className="shop-content">
        <p className="section-help">
          Scout the minor leagues! Every pick costs <strong>&#x1FA99; {DRAFT_COST}</strong> coins.
          Look at their skills and choose who joins your team.
        </p>
        <p className="section-help">
          Your team: {profile.roster.length} / {MAX_TEAM} players.
        </p>

        {error && <p className="shop-error">{error}</p>}

        <div className="draft-grid">
          {/* Create-your-own-player card, always first on the board */}
          <div className="draft-card draft-card-custom">
            <span className="draft-name">Customize Player</span>
            <span className="draft-overall">Make your OWN player!</span>
            <span className="draft-custom-icon">&#127912;</span>
            <button
              className="btn btn-buy"
              onClick={() => { setError(''); setCustomizing(true); }}
              disabled={profile.coins < CUSTOM_COST || teamFull}
            >
              Create <span className="coin-icon">&#x1FA99;</span> {CUSTOM_COST}
            </button>
          </div>
          {prospects.map((p) => {
              const canAfford = profile.coins >= DRAFT_COST;
              return (
                <div key={p.name} className="draft-card">
                  <span className="draft-name">{p.name}</span>
                  <span className="draft-overall">Overall {playerAverage(p)}</span>
                  <div className="reveal-stats">
                    <span>BAT {p.batting}</span>
                    <span>PIT {p.pitching}</span>
                    <span>FLD {p.fielding}</span>
                    <span>SPD {p.speed}</span>
                  </div>
                  <button
                    className="btn btn-buy"
                    onClick={() => draftPlayer(p)}
                    disabled={!canAfford || teamFull}
                  >
                    Draft <span className="coin-icon">&#x1FA99;</span> {DRAFT_COST}
                  </button>
                </div>
              );
            })}
        </div>
        {prospects.length === 0 && (
          <p className="section-help">
            You drafted everyone! The minor leagues are empty for now.
          </p>
        )}
      </div>

      {customizing && (
        <div className="exit-dialog-backdrop" onClick={() => setCustomizing(false)}>
          <div className="exit-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="exit-dialog-title">Customize Player</h2>
            <p className="exit-dialog-text">
              Give your player a name! Costs <strong>&#x1FA99; {CUSTOM_COST}</strong> coins.
            </p>
            <input
              className="custom-name-input"
              type="text"
              maxLength={20}
              placeholder="Player name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createCustomPlayer(); }}
              autoFocus
            />
            <div className="exit-dialog-buttons">
              <button
                className="btn-exit-save"
                disabled={!customName.trim()}
                onClick={createCustomPlayer}
              >
                Create
              </button>
              <button className="btn-exit-close" onClick={() => { setCustomizing(false); setCustomName(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {drafted && (
        <div className="exit-dialog-backdrop" onClick={() => setDrafted(null)}>
          <div className="exit-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="exit-dialog-title">Welcome to the team!</h2>
            <p className="exit-dialog-text">
              <strong>{drafted.name}</strong> joined The {profile.teamName}.
              Set his field position in My Team.
            </p>
            <button className="btn btn-primary" onClick={() => setDrafted(null)}>
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
