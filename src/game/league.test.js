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
  assert.equal(league.teams.filter((t) => t.wins + t.losses === 1).length, 14);
  assert.equal(league.teams.filter((t) => t.wins + t.losses === 0).length, 1);
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
  assert.equal(p.league.teams[0].wins + p.league.teams[0].losses + p.league.teams[0].ties, 14);
  assert.ok(p.league.teams.slice(1).every((t) => t.wins + t.losses + t.ties === 13));
  assert.equal(getNextLeagueGame(p).round, 16);
  assert.equal(getLeague(profile).teams[0].wins, 0);
});

test('each finished game advances one league day with seven games and one resting club, across repeat schedules', () => {
  let p = { ...profile, league: getLeague(profile) };
  for (let day = 1; day <= 60; day += 1) {
    assert.equal(getNextLeagueGame(p).day, day);
    const before = new Map(getStandings(p).map((t) => [t.id, t.gamesPlayed]));
    p = { ...p, league: recordLeagueGame(p, finish(p, day % 3, 1)) };
    const increases = getStandings(p).map((t) => t.gamesPlayed - before.get(t.id));
    assert.equal(increases.filter((n) => n === 1).length, 14);
    assert.equal(increases.filter((n) => n === 0).length, 1);
    assert.equal(increases.reduce((sum, n) => sum + n, 0), 14);
    assert.equal(p.league.teams.reduce((sum, t) => sum + t.wins - t.losses, 0), 0);
    assert.equal(p.league.teams.reduce((sum, t) => sum + t.runsFor - t.runsAgainst, 0), 0);
  }
});

// Actual version-1 save snapshots, captured before the scheduling fix.
const legacySaves = [
  { days: 1, round: 2, records: [[1,0,0,5,2],[0,2,0,5,9],[1,0,0,9,5],[2,0,0,14,3],[1,1,0,13,11],[2,0,0,16,11],[0,2,0,7,12],[1,1,0,9,9],[1,1,0,12,13],[1,1,0,9,8],[1,1,0,7,9],[1,1,0,8,8],[0,2,0,8,12],[1,1,0,15,18],[1,1,0,5,12]] },
  { days: 16, round: 18, records: [[16,0,0,80,32],[5,12,0,64,82],[9,7,0,73,66],[6,11,0,84,90],[4,12,0,60,97],[8,9,0,87,98],[9,8,0,85,84],[7,10,0,69,98],[7,10,0,86,79],[11,6,0,78,59],[7,10,0,70,80],[8,9,0,80,89],[12,5,0,104,68],[8,9,0,82,75],[9,8,0,77,82]] },
];

for (const saved of legacySaves) {
  test(`repair a ${saved.days}-game old save without losing actual results or changing player rewards`, () => {
    const legacy = { ...getLeague(profile), version: 1, round: saved.round };
    legacy.teams = legacy.teams.map((team, i) => {
      const [wins, losses, ties, runsFor, runsAgainst] = saved.records[i];
      return { ...team, wins, losses, ties, runsFor, runsAgainst };
    });
    const p = { ...profile, coins: 321, tokens: 4, fireballs: 3, league: legacy };
    const original = JSON.stringify(p);
    const repaired = getLeague(p);
    let expected = { ...profile };
    for (let i = 0; i < saved.days; i += 1) {
      expected = { ...expected, league: recordLeagueGame(expected, finish(expected)) };
    }
    assert.deepEqual(repaired, expected.league);
    assert.deepEqual(repaired.teams[0], legacy.teams[0]);
    assert.equal(JSON.stringify(p), original);
    const reloaded = JSON.parse(JSON.stringify({ ...p, league: repaired }));
    assert.strictEqual(getLeague(reloaded), reloaded.league);
    assert.equal(reloaded.coins, 321);
    assert.equal(reloaded.tokens, 4);
    assert.equal(reloaded.fireballs, 3);
    assert.equal(getNextLeagueGame(reloaded).day, saved.days + 1);
    const after = recordLeagueGame(p, finish(p));
    assert.equal(after.teams[0].wins, saved.days + 1);
    for (let i = 0; i < after.teams.length; i += 1) {
      const count = (t) => t.wins + t.losses + t.ties;
      assert.ok(count(after.teams[i]) - count(repaired.teams[i]) <= 1);
    }
  });
}

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
