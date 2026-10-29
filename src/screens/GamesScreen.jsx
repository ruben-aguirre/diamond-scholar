import { useState } from 'react';
import { getLeagueSeason } from '../game/league';
import { calendarDateKey, parseCalendarDate, getSeasonSchedule, calendarMonthGrid, shiftCalendarMonth } from '../game/leagueCalendar';
import HalloweenDecorations from './HalloweenDecorations';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_LABEL = { played: 'Played', next: 'Next up', scheduled: 'Coming up' };
const monthOf = (key) => `${key.slice(0, 7)}-01`;

function CalendarTeam({ team }) {
  return (
    <span className="calendar-team">
      <span className="league-team-dot" style={{ backgroundColor: team.primary }} aria-hidden="true" />
      <span><strong>#{team.rank}</strong> {team.name}</span>
    </span>
  );
}

export default function GamesScreen({ profile, season, onBack, onPlay, onStandings }) {
  const [today] = useState(() => calendarDateKey(new Date()));
  const schedule = getSeasonSchedule(profile, parseCalendarDate(today));
  const nextGame = schedule.find((day) => day.status === 'next');
  const [selected, setSelected] = useState(() => nextGame?.date || schedule.at(-1).date);
  const [month, setMonth] = useState(() => monthOf(selected));
  const monthDate = parseCalendarDate(month);
  const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const cells = calendarMonthGrid(month);
  const byDate = new Map(schedule.map((day) => [day.date, day]));
  const selectedGame = byDate.get(selected);
  const progress = getLeagueSeason(profile);

  function jumpTo(date) {
    setSelected(date);
    setMonth(monthOf(date));
  }

  function changeMonth(offset) {
    const nextMonth = shiftCalendarMonth(month, offset);
    setMonth(nextMonth);
    setSelected(schedule.find((day) => monthOf(day.date) === nextMonth)?.date || nextMonth);
  }

  return (
    <div className="games-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack} aria-label="Back to home">←</button>
        <h1>📅 Games</h1>
      </header>
      <main className="games-card">
        {season?.id === 'halloween' && <HalloweenDecorations garland />}
        <div className="games-heading">
          <div><span className="home-section-kicker">SEASON {progress.number} · 20 GAMES</span><h2>Your game calendar</h2><p>Pick a date to see who is playing.</p></div>
          <button className="btn btn-secondary" onClick={onStandings}>Team Standings</button>
        </div>
        <div className="calendar-toolbar">
          <button className="btn btn-secondary" onClick={() => changeMonth(-1)} aria-label="Previous month">←</button>
          <h2 id="calendar-month">{monthLabel}</h2>
          <button className="btn btn-secondary" onClick={() => changeMonth(1)} aria-label="Next month">→</button>
        </div>
        <div className="calendar-shortcuts">
          <button className="btn btn-small btn-secondary" onClick={() => jumpTo(today)}>Today</button>
          {nextGame && <button className="btn btn-small btn-secondary" onClick={() => jumpTo(nextGame.date)}>Next Game</button>}
          <span>{progress.gamesPlayed} of 20 games finished</span>
        </div>
        <table className="games-calendar" aria-labelledby="calendar-month">
          <thead><tr>{WEEKDAYS.map((day) => <th key={day} scope="col">{day}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, week) => (
              <tr key={week}>
                {cells.slice(week * 7, week * 7 + 7).map((date) => {
                  const entry = byDate.get(date);
                  const opponent = entry?.games[0].away;
                  const dateLabel = parseCalendarDate(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                  return (
                    <td key={date} className={monthOf(date) !== month ? 'calendar-other-month' : ''}>
                      <button
                        className={`calendar-day ${entry ? `has-game calendar-${entry.status}` : ''} ${date === today ? 'calendar-today' : ''} ${date === selected ? 'calendar-selected' : ''}`}
                        onClick={() => jumpTo(date)}
                        aria-pressed={date === selected}
                        aria-current={date === today ? 'date' : undefined}
                        aria-label={`${dateLabel}${entry ? `, game ${entry.day} of 20, ${profile.teamName} versus ${opponent.name}, ${STATUS_LABEL[entry.status]}` : ', no games'}`}
                      >
                        <span className="calendar-date-number">{Number(date.slice(-2))}</span>
                        {entry && <><span className="calendar-game-number">G{entry.day}</span><span className="calendar-cell-opponent">vs #{opponent.rank} {opponent.name.split(' ').at(-1)}</span><span className="calendar-cell-status">{STATUS_LABEL[entry.status]}</span></>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="calendar-key">G = game number · Green = played · Gold = next game</p>
        <section className="calendar-details" aria-labelledby="calendar-selected-date">
          <h2 id="calendar-selected-date">{parseCalendarDate(selected).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          {selectedGame ? (
            <>
              <p className="calendar-detail-status">Game {selectedGame.day} of 20 · {STATUS_LABEL[selectedGame.status]} · 7 games</p>
              <p className="calendar-rank-note">Numbers beside teams show their current place in the standings.</p>
              <ul className="calendar-matchups">
                {selectedGame.games.map((game) => (
                  <li key={game.home.id} className={game.isPlayerGame ? 'calendar-your-game' : ''}>
                    <CalendarTeam team={game.home} />
                    <span className="calendar-versus">vs</span>
                    <CalendarTeam team={game.away} />
                  </li>
                ))}
              </ul>
              <p className="calendar-resting">Day off: <strong>#{selectedGame.resting.rank} {selectedGame.resting.name}</strong></p>
              {selectedGame.status === 'next' && <button className="btn btn-primary" onClick={onPlay}>Play Game {selectedGame.day}</button>}
              {selectedGame.status === 'scheduled' && nextGame && <button className="btn btn-secondary" onClick={() => jumpTo(nextGame.date)}>Go to your next game</button>}
            </>
          ) : <p>No games on this date. Choose a date marked with a game number.</p>}
          {progress.complete && <button className="btn btn-primary" onClick={onStandings}>Final Standings</button>}
        </section>
        <p className="calendar-key">One game day per date. You can play ahead at your own pace. Every team plays at most once per day.</p>
      </main>
    </div>
  );
}
