import { useEffect, useState } from 'react';
import { getLeague, getNextLeagueGame } from '../game/league';
import { startMatchupCountdown } from '../game/matchupCountdown';
import GameScreen from './GameScreen';
import HalloweenDecorations from './HalloweenDecorations';

export default function GameIntro({ profile, season, onBack, onGameEnd, onSaveAndExit, onTokenReward }) {
  const [matchup] = useState(() => getNextLeagueGame(profile));
  const [seconds, setSeconds] = useState(5);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!matchup) return;
    return startMatchupCountdown(setSeconds, () => setStarted(true));
  }, [matchup]);

  if (!matchup) {
    return <div className="matchup-screen"><main className="matchup-card"><h1>Season complete!</h1><button className="btn btn-primary" onClick={onBack}>Back to Home</button></main></div>;
  }

  if (started) {
    return <GameScreen profile={profile} season={season} leagueMatchup={matchup} onGameEnd={onGameEnd} onSaveAndExit={onSaveAndExit} onTokenReward={onTokenReward} />;
  }

  const yourRecord = getLeague(profile).teams[0];
  return (
    <div className="matchup-screen">
      <main className="matchup-card" aria-labelledby="matchup-title">
        {season?.id === 'halloween' && <HalloweenDecorations garland />}
        <span className="matchup-kicker">GAME {matchup.day} OF {matchup.totalGames}</span>
        <h1 id="matchup-title">Today&apos;s matchup</h1>
        <div className="matchup-teams">
          <section className="matchup-team" aria-label="Your team">
            <span className="matchup-badge" style={{ backgroundColor: profile.teamColor.primary }} aria-hidden="true">⚾</span>
            <span className="matchup-team-label">YOUR TEAM</span>
            <h2>{profile.teamName}</h2>
            <p>{yourRecord.wins} wins · {yourRecord.losses} losses · {yourRecord.ties} ties</p>
          </section>
          <strong className="matchup-vs" aria-label="versus">VS</strong>
          <section className="matchup-team" aria-label="Opponent">
            <span className="matchup-badge" style={{ backgroundColor: matchup.opponent.primary }} aria-hidden="true">⚾</span>
            <span className="matchup-team-label">COMPUTER TEAM</span>
            <h2>{matchup.opponent.name}</h2>
            <p>{matchup.opponent.wins} wins · {matchup.opponent.losses} losses · {matchup.opponent.ties} ties</p>
          </section>
        </div>
        <div className="matchup-countdown" role="status" aria-live="polite" aria-atomic="true">
          <span>Game starts in</span>
          <strong>{seconds}</strong>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>Back to Home</button>
      </main>
    </div>
  );
}
