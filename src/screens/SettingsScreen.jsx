import { getGameInnings, INNING_OPTIONS, getGameDifficulty, DIFFICULTY_OPTIONS } from '../game/gameSettings';

export default function SettingsScreen({ profile, onUpdateProfile, onBack }) {
  const innings = getGameInnings(profile);
  const difficulty = getGameDifficulty(profile);
  return (
    <div className="settings-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack} aria-label="Back to home">←</button>
        <h1>⚙️ Settings</h1>
      </header>
      <section className="settings-card">
        <h2>How tough should the game be?</h2>
        <p>Pick your challenge for the next game.</p>
        <fieldset className="inning-options difficulty-options">
          <legend>Difficulty</legend>
          {DIFFICULTY_OPTIONS.map((option) => (
            <label key={option.id} className={`inning-option ${difficulty.id === option.id ? 'selected' : ''}`}>
              <input type="radio" name="game-difficulty" value={option.id} checked={difficulty.id === option.id}
                onChange={() => onUpdateProfile({ gameDifficulty: option.id })} />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </label>
          ))}
        </fieldset>
        <h2>How long do you want to play?</h2>
        <p>Choose how many innings your next game will have.</p>
        <fieldset className="inning-options">
          <legend>Game length</legend>
          {INNING_OPTIONS.map((count) => (
            <label key={count} className={`inning-option ${innings === count ? 'selected' : ''}`}>
              <input
                type="radio"
                name="game-innings"
                value={count}
                checked={innings === count}
                onChange={() => onUpdateProfile({ gameInnings: count })}
              />
              <strong>{count} {count === 1 ? 'inning' : 'innings'}</strong>
              <span>{count === 1 ? 'Quick game' : count === 3 ? 'Regular game' : 'Full game'}</span>
            </label>
          ))}
        </fieldset>
        <p className="settings-saved" role="status">Saved for {profile.name}: {difficulty.label} · {innings} {innings === 1 ? 'inning' : 'innings'}.</p>
        <p className="settings-note">Both teams bat each inning. A 7-run lead can end the game early.</p>
        <button className="btn btn-primary" onClick={onBack}>Done</button>
      </section>
    </div>
  );
}
