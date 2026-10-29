import { canClaimSeasonalPack } from '../game/seasons';
import HalloweenDecorations from './HalloweenDecorations';
import NightStadium from './NightStadium';
import { getGameInnings } from '../game/gameSettings';
import { getLeague, getNextLeagueGame } from '../game/league';

export default function HomeScreen({ profile, onNavigate, onSwitchProfile, season }) {
  const menuItems = [
    { id: 'team', label: 'My Team', icon: '&#128101;', enabled: true, description: 'Set your lineup' },
    { id: 'standings', label: 'Team Standings', icon: '&#127942;', enabled: true, description: 'Your 15-team league' },
    { id: 'batting-practice', label: 'Batting Practice', icon: '&#127951;', enabled: true, description: 'Time your swing' },
    { id: 'fielding-practice', label: 'Fielding Practice', icon: '&#129351;', enabled: true, description: 'Make the right throw' },
    { id: 'running-practice', label: 'Running Practice', icon: '&#127939;', enabled: true, description: 'Run the bases' },
    { id: 'shop', label: 'Card Shop', icon: '&#127183;', enabled: true, description: 'Open player packs' },
    { id: 'draft', label: 'Draft Day', icon: '&#128203;', enabled: true, description: 'Find a future star' },
  ];

  const record = getLeague(profile).teams[0];
  const gamesPlayed = record.wins + record.losses + record.ties;
  const { opponent } = getNextLeagueGame(profile);

  return (
    <div className="home-screen">
      <header className="home-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <div className="header-left">
          <span className="home-brand">DIAMOND SCHOLAR</span>
          <h1 className="team-name">The {profile.teamName}</h1>
          <span className="player-name">{profile.name}</span>
        </div>
        <div className="header-right">
          <button className="home-settings-button" onClick={() => onNavigate('settings')} aria-label="Settings" title="Settings">
            <span aria-hidden="true">⚙️</span>
          </button>
          <div className="coin-display">
            <span className="coin-icon">&#x1FA99;</span>
            <span className="coin-amount">{profile.coins}</span>
            <span className="coin-icon" style={{ marginLeft: 10 }}>🎟️</span>
            <span className="coin-amount">{profile.tokens || 0}</span>
          </div>
        </div>
      </header>

      <div className="home-content">
        {season?.id === 'halloween' && (
          <>
            <HalloweenDecorations />
            <HalloweenDecorations garland />
          </>
        )}
        {(canClaimSeasonalPack(profile, season) || profile.seasonalPackReveal) && (
          <section className="holiday-gift">
            <span className="holiday-gift-icon" aria-hidden="true">🎁</span>
            <div>
              <strong>{profile.seasonalPackReveal ? 'Your Gold Pack is waiting!' : `Happy ${season.name}!`}</strong>
              <p>A free Gold Pack for your team. No coins needed!</p>
            </div>
            <button className="btn" onClick={() => onNavigate('shop')}>Open your gift</button>
          </section>
        )}
        <section className="home-hero">
          {season?.id === 'halloween' && <NightStadium />}
          <div className="home-hero-shade" />
          <div className="home-hero-copy">
            <span className="home-hero-kicker">&#9918; TODAY&apos;S GAME</span>
            <h2>Take the field,<br />{profile.name}!</h2>
            <p>Next opponent: <strong>{opponent.name}</strong></p>
            <button className="home-play-button" onClick={() => onNavigate('game')}>
              <span>PLAY BALL!<small className="home-game-length">{getGameInnings(profile)} {getGameInnings(profile) === 1 ? 'inning' : 'innings'}</small></span>
              <span className="home-play-arrow">&#9654;</span>
            </button>
          </div>
          <div className="home-record-card">
            <span className="home-record-label">LEAGUE RECORD · W–L–T</span>
            <strong>{record.wins} - {record.losses} - {record.ties}</strong>
            <span>{gamesPlayed === 0 ? 'Your season starts now!' : `${gamesPlayed} games played`}</span>
            <button className="league-standings-link" onClick={() => onNavigate('standings')}>View standings →</button>
          </div>
        </section>

        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">YOUR CLUBHOUSE</span>
            <h2>What do you want to do?</h2>
          </div>
          <span className="home-section-ball" aria-hidden="true">{season?.id === 'halloween' ? '🎃' : '⚾'}</span>
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
