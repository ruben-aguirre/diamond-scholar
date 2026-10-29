import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLeagueSeason, getNextLeagueGame, getStandings, recordLeagueGame, startNextLeagueSeason } from './league.js';
import { calendarDateKey, parseCalendarDate, addCalendarDays, getCalendarLeague, getSeasonSchedule, calendarMonthGrid, shiftCalendarMonth } from './leagueCalendar.js';

const profile = { teamName: 'My Sluggers', teamColor: { primary: '#123456' } };
const today = new Date(2026, 9, 28, 12);
function finish(p) {
  const next = getNextLeagueGame(p);
  return { ...p, league: recordLeagueGame(p, { leagueRound: next.round, seasonNumber: next.seasonNumber, opponentId: next.opponent.id, playerScore: 5, aiScore: 2 }) };
}

test('schedule has 20 calendar dates crossing months, matching gameplay with no doubleheaders', () => {
  let p = { ...profile, league: getCalendarLeague(profile, today) };
  const schedule = getSeasonSchedule(p, today);
  assert.equal(schedule.length, 20);
  assert.equal(schedule[0].date, '2026-10-28');
  assert.equal(schedule.at(-1).date, '2026-11-16');
  for (let i = 0; i < 20; i += 1) {
    const day = schedule[i];
    const next = getNextLeagueGame(p);
    assert.equal(day.round, next.round);
    assert.equal(day.games[0].away.id, next.opponent.id);
    assert.equal(day.games[0].isPlayerGame, true);
    assert.equal(day.games.length, 7);
    const ids = day.games.flatMap((game) => [game.home.id, game.away.id]);
    assert.equal(new Set(ids).size, 14);
    assert.equal(ids.includes(day.resting.id), false);
    p = finish(p);
  }
  assert.equal(getLeagueSeason(p).complete, true);
  assert.ok(getSeasonSchedule(p, today).every((day) => day.status === 'played'));
});

test('saved dates stay fixed across reloads and show played, next, and future games', () => {
  let p = { ...profile, league: getCalendarLeague(profile, today) };
  for (let i = 0; i < 3; i += 1) p = finish(p);
  const reloaded = JSON.parse(JSON.stringify(p));
  const schedule = getSeasonSchedule(reloaded, new Date(2026, 11, 10, 12));
  assert.equal(schedule[0].date, '2026-10-28');
  assert.deepEqual(schedule.slice(0, 5).map((day) => day.status), ['played', 'played', 'played', 'next', 'scheduled']);
  assert.strictEqual(getCalendarLeague(reloaded, today), reloaded.league);
  const ranks = new Map(getStandings(reloaded).map((team, index) => [team.id, index + 1]));
  for (const game of schedule[3].games) {
    assert.equal(game.home.rank, ranks.get(game.home.id));
    assert.equal(game.away.rank, ranks.get(game.away.id));
  }
});

test('an older save anchors its next game to today without changing any results', () => {
  let p = { ...profile };
  for (let i = 0; i < 4; i += 1) p = finish(p);
  const before = JSON.stringify(p);
  const anchored = getCalendarLeague(p, today);
  assert.equal(anchored.scheduleStartDate, '2026-10-24');
  assert.equal(getSeasonSchedule({ ...p, league: anchored }, today)[4].date, '2026-10-28');
  assert.deepEqual(anchored.teams, p.league.teams);
  assert.equal(JSON.stringify(p), before);
});

test('next season gets fresh calendar dates, retaining the completed season record', () => {
  let p = { ...profile, league: getCalendarLeague(profile, today) };
  for (let i = 0; i < 20; i += 1) p = finish(p);
  p = { ...p, league: startNextLeagueSeason(p) };
  const anchored = getCalendarLeague(p, new Date(2026, 11, 5, 12));
  assert.equal(anchored.scheduleStartDate, '2026-12-05');
  assert.equal(anchored.previousSeason.standings.length, 15);
  assert.equal(getSeasonSchedule({ ...p, league: anchored })[0].status, 'next');
});

test('month grids align weekdays, include leap day, and navigate across years', () => {
  const october = calendarMonthGrid('2026-10-01');
  assert.equal(october.length, 35);
  assert.equal(october[0], '2026-09-27');
  assert.equal(october.at(-1), '2026-10-31');
  assert.equal(parseCalendarDate(october[0]).getDay(), 0);
  assert.ok(calendarMonthGrid('2028-02-01').includes('2028-02-29'));
  assert.equal(shiftCalendarMonth('2026-12-01', 1), '2027-01-01');
  assert.equal(shiftCalendarMonth('2027-01-01', -1), '2026-12-01');
  assert.equal(addCalendarDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addCalendarDays('2026-10-31', 2), '2026-11-02');
  assert.equal(calendarDateKey(parseCalendarDate('2026-10-28')), '2026-10-28');
  assert.equal(parseCalendarDate('2026-02-30'), null);
  assert.equal(parseCalendarDate('invalid'), null);
});
