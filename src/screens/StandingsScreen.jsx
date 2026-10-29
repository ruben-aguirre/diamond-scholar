import { getLeagueSeason, getNextLeagueGame, getStandings, PLAYER_TEAM_ID } from '../game/league';
import HalloweenDecorations from './HalloweenDecorations';

export default function StandingsScreen({ profile, onBack, onPlay, onNextSeason, season }) {
  const standings = getStandings(profile);
  const leagueSeason = getLeagueSeason(profile);
  const matchup = getNextLeagueGame(profile);
  const rank = standings.findIndex((team) => team.id === PLAYER_TEAM_ID) + 1;
  return (
    <div className="standings-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack} aria-label="Back to home">←</button>
        <h1>🏆 Team Standings</h1>
      </header>
      <main className="standings-card">
        {season?.id === 'halloween' && <HalloweenDecorations />}
        <div className="standings-intro">
          <span className="home-section-kicker">DIAMOND SCHOLAR LEAGUE</span>
          <h2>{leagueSeason.complete ? 'Final standings!' : '15 teams. 20 games. One climb to the top!'}</h2>
          <p>Your team is #{rank} of 15. The other 14 teams are computer teams.</p>
          <p>Season {leagueSeason.number} · {leagueSeason.gamesPlayed} of {leagueSeason.totalGames} games finished.</p>
        </div>
        <section className="league-matchup" aria-label={leagueSeason.complete ? 'Season results' : 'Next game'}>
          {leagueSeason.complete ? (
            <>
              <div><strong>🏆 Season champion: {standings[0].name}</strong><p>All 20 games are finished! A new season starts fresh standings. Keep your players and rewards.</p></div>
              <button className="btn btn-primary" onClick={onNextSeason}>Start Next Season</button>
            </>
          ) : (
            <>
              <div><strong>Game {matchup.day} of {matchup.totalGames}: {matchup.opponent.name}</strong><p>Your record updates when you finish a game and return home.</p></div>
              <button className="btn btn-primary" onClick={onPlay}>Play Ball!</button>
            </>
          )}
        </section>
        {season?.id === 'halloween' && <HalloweenDecorations garland />}
        <table className="standings-table">
          <caption>Ranked by winning percentage, then wins, run difference, and team name.</caption>
          <thead><tr><th scope="col">#</th><th scope="col">Team</th><th scope="col">W</th><th scope="col">L</th><th scope="col">T</th><th scope="col">PCT</th></tr></thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id} className={team.id === PLAYER_TEAM_ID ? 'your-team-row' : ''}>
                <td>{index + 1}</td>
                <th scope="row"><span className="league-team-dot" style={{ backgroundColor: team.primary }} aria-hidden="true" />{team.name}{team.id === PLAYER_TEAM_ID && <span className="league-you">YOU</span>}</th>
                <td>{team.wins}</td><td>{team.losses}</td><td>{team.ties}</td>
                <td>{team.gamesPlayed ? team.percentage.toFixed(3).replace(/^0/, '') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {season?.id === 'halloween' && <HalloweenDecorations garland />}
        <p className="standings-help">W = wins · L = losses · T = ties · PCT = winning percentage.</p>
        <p className="standings-help">Your season lasts 20 finished games. Each game advances one league day. Every team plays at most once per day, and one computer team rests. Your team faces all 14 opponents before any rematches. Ties count as half a win.</p>
        <p className="standings-help">Your league starts at 0–0. Earlier games stay in your career record. Saving and leaving a game early does not change standings.</p>
      </main>
    </div>
  );
}
