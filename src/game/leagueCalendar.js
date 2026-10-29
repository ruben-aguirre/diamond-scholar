import { getLeague, getLeagueSeason, getRoundFixtures, getStandings, PLAYER_TEAM_ID, SEASON_GAMES } from './league.js';

export function calendarDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseCalendarDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '')) return null;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return calendarDateKey(date) === key ? date : null;
}

export function addCalendarDays(key, days) {
  const date = parseCalendarDate(key);
  if (!date) throw new Error('Invalid calendar date');
  date.setDate(date.getDate() + days);
  return calendarDateKey(date);
}

// Persist this anchor on first calendar visit/game launch. Existing saves put
// their next game on today, without inventing actual historical play dates.
export function getCalendarLeague(profile, today = new Date()) {
  const league = getLeague(profile);
  if (parseCalendarDate(league.scheduleStartDate)) return league;
  const completed = Math.min(getLeagueSeason(profile).gamesPlayed, SEASON_GAMES - 1);
  return { ...league, scheduleStartDate: addCalendarDays(calendarDateKey(today), -completed) };
}

export function getSeasonSchedule(profile, today = new Date()) {
  const league = getCalendarLeague(profile, today);
  const progress = getLeagueSeason(profile);
  const ranked = getStandings(profile).map((team, index) => ({ ...team, rank: index + 1 }));
  const byId = new Map(ranked.map((team) => [team.id, team]));
  let round = 0;
  return Array.from({ length: SEASON_GAMES }, (_, index) => {
    let fixtures = getRoundFixtures(league, round);
    while (!fixtures.some((pair) => pair.includes(PLAYER_TEAM_ID))) {
      round += 1;
      fixtures = getRoundFixtures(league, round);
    }
    const games = fixtures.map(([a, b]) => ({
      home: byId.get(a), away: byId.get(b),
      isPlayerGame: a === PLAYER_TEAM_ID || b === PLAYER_TEAM_ID,
    })).sort((a, b) => Number(b.isPlayerGame) - Number(a.isPlayerGame));
    const playing = new Set(fixtures.flat());
    const entry = {
      date: addCalendarDays(league.scheduleStartDate, index),
      day: index + 1,
      round,
      games,
      resting: ranked.find((team) => !playing.has(team.id)),
      status: index < progress.gamesPlayed ? 'played' : index === progress.gamesPlayed ? 'next' : 'scheduled',
    };
    round += 1;
    return entry;
  });
}

export function calendarMonthGrid(monthKey) {
  const first = parseCalendarDate(monthKey);
  if (!first || first.getDate() !== 1) throw new Error('Expected the first day of a month');
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  const start = addCalendarDays(monthKey, -first.getDay());
  return Array.from({ length: count }, (_, i) => addCalendarDays(start, i));
}

export function shiftCalendarMonth(monthKey, offset) {
  const date = parseCalendarDate(monthKey);
  if (!date) throw new Error('Invalid calendar month');
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return calendarDateKey(date);
}
