import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLeague, getNextLeagueGame, getRoundFixtures, getStandings, recordLeagueGame, PLAYER_TEAM_ID } from './league.js';

const profile = { teamName: 'My Sluggers', teamColor: { primary: '#123456' }, stats: { gamesPlayed: 42, gamesWon: 30 } };
function finish(p, playerScore = 5, aiScore = 2) {
  const match = getNextLeagueGame(p);
  return { leagueRound: match.round, opponentId: match.opponent.id, playerScore, aiScore };
}

test('new and older profiles get exactly one player team and 14 unique NPCs', () => {
  for (const teamName of [profile.teamName, 'Arizona Roadrunners', '  ATLANTA FIREBIRDS  ']) {
    const p = { ...profile, teamName };
    const league = getLeague(p);
    assert.equal(league.teams.length, 15);
    assert.equal(league.teams.filter((t) => t.id === PLAYER_TEAM_ID).length, 1);
    assert.equal(new Set(getStandings(p).map((t) => t.name.trim().toLowerCase())).size, 15);
    assert.ok(league.teams.every((t) => t.wins + t.losses + t.ties === 0));
    assert.equal(p.stats.gamesPlayed, 42);
  }
});

test('a full schedule has every pairing exactly once and one rest per team', () => {
  const league = getLeague(profile);
  const pairs = new Set();
  const games = new Map(league.teams.map((t) => [t.id, 0]));
  for (let round = 0; round < 15; round += 1) {
    const fixtures = getRoundFixtures(league, round);
    assert.equal(fixtures.length, 7);
    assert.equal(new Set(fixtures.flat()).size, 14);
    for (const pair of fixtures) {
      pairs.add([...pair].sort().join('|'));
      for (const id of pair) games.set(id, games.get(id) + 1);
    }
  }
  assert.equal(pairs.size, 105);
  assert.ok([...games.values()].every((n) => n === 14));
});

test('finished games update both clubs and simulate NPC games without mutating the old save', () => {
  const p = { ...profile, league: getLeague(profile) };
  const before = JSON.stringify(p);
  const result = finish(p);
  const league = recordLeagueGame(p, result);
  const you = league.teams[0];
  const opponent = league.teams.find((t) => t.id === result.opponentId);
  assert.equal(you.wins, 1);
  assert.equal(opponent.losses >= 1, true);
  assert.equal(you.runsFor, 5);
  assert.equal(you.runsAgainst, 2);
  assert.ok(league.teams.filter((t) => t.id !== PLAYER_TEAM_ID).every((t) => t.wins + t.losses > 0));
  assert.equal(league.teams.reduce((s, t) => s + t.wins - t.losses, 0), 0);
  assert.equal(league.teams.reduce((s, t) => s + t.runsFor - t.runsAgainst, 0), 0);
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(recordLeagueGame(p, result), league);
});

test('losses and ties are recorded correctly; ties count as half a win', () => {
  let p = { ...profile, league: recordLeagueGame(profile, finish(profile, 1, 3)) };
  assert.equal(p.league.teams[0].losses, 1);
  p = { ...p, league: recordLeagueGame(p, finish(p, 4, 4)) };
  const you = getStandings(p).find((t) => t.id === PLAYER_TEAM_ID);
  assert.equal(you.ties, 1);
  assert.equal(you.losses, 1);
  assert.equal(you.percentage, .25);
});

test('stale, duplicate, wrong-opponent, and invalid results cannot advance standings', () => {
  const result = finish(profile);
  const p = { ...profile, league: recordLeagueGame(profile, result) };
  assert.strictEqual(recordLeagueGame(p, result), p.league);
  for (const change of [{ opponentId: 'unknown' }, { leagueRound: -1 }, { playerScore: -1 }, { aiScore: NaN }]) {
    assert.strictEqual(recordLeagueGame(p, { ...finish(p), ...change }), p.league);
  }
});

test('14 finished games face all 14 NPCs; saving and loading preserves the schedule', () => {
  let p = structuredClone(profile);
  const opponents = new Set();
  for (let i = 0; i < 14; i += 1) {
    const result = finish(p);
    opponents.add(result.opponentId);
    p = JSON.parse(JSON.stringify({ ...p, league: recordLeagueGame(p, result) }));
  }
  assert.equal(opponents.size, 14);
  assert.ok(p.league.teams.every((t) => t.wins + t.losses + t.ties === 14));
  assert.equal(getNextLeagueGame(p).round, 16);
  assert.equal(getLeague(profile).teams[0].wins, 0);
});

test('standings rank by percentage, wins, run difference, then name with stable ranks', () => {
  const league = getLeague(profile);
  Object.assign(league.teams[0], { wins: 2, losses: 0 });
  Object.assign(league.teams[1], { wins: 3, losses: 1 });
  Object.assign(league.teams[2], { wins: 1, losses: 1 });
  Object.assign(league.teams[3], { wins: 1, losses: 1, runsFor: 8, runsAgainst: 2 });
  const rows = getStandings({ ...profile, league });
  assert.deepEqual(rows.slice(0, 4).map((t) => t.id), [PLAYER_TEAM_ID, league.teams[1].id, league.teams[3].id, league.teams[2].id]);
  assert.deepEqual(getStandings(profile), getStandings(profile));
});
