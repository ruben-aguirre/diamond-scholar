import assert from 'node:assert/strict';
import { test } from 'node:test';
import { starterRoster } from '../data/players.js';
import { getLeague, getNextLeagueGame, recordLeagueGame, startNextLeagueSeason } from './league.js';
import { offerPlayer, saleAcceptanceChance } from './playerSales.js';

function makeProfile() {
  const roster = [...starterRoster.map((p) => ({ ...p })), { ...starterRoster[0], id: 'bench', name: 'Bench Player', position: null }];
  return { teamName: 'Archers', teamColor: { primary: '#123456' }, roster, lineup: roster.map((p) => p.id), coins: 120, tokens: 2, stats: { gamesPlayed: 7, totalCoinsEarned: 240 } };
}
function offer(profile, price = 50, roll = 0, playerId = 'p1', teamId = getLeague(profile).teams[1].id) {
  return offerPlayer(profile, playerId, teamId, price, roll);
}

test('every higher price decreases acceptance; zero always accepts and 100 still has a chance', () => {
  assert.equal(saleAcceptanceChance(0), 1);
  assert.ok(Math.abs(saleAcceptanceChance(100) - 0.1) < 1e-10);
  for (let price = 1; price <= 100; price++) assert.ok(saleAcceptanceChance(price) < saleAcceptanceChance(price - 1));
  assert.equal(offer(makeProfile(), 0, 0.9999).status, 'accepted');
  assert.equal(offer(makeProfile(), 100, 0.05).status, 'accepted');
  assert.equal(offer(makeProfile(), 100, 0.5).status, 'declined');
});

test('a yes transfers the complete player to the selected team and pays exactly once', () => {
  const profile = makeProfile();
  const before = structuredClone(profile);
  const target = getLeague(profile).teams[3].id;
  const result = offer(profile, 73, 0.1, 'p1', target);
  const saved = JSON.parse(JSON.stringify({ ...profile, ...result.updates }));
  assert.equal(result.status, 'accepted');
  assert.equal(saved.roster.length, 9);
  assert.ok(!saved.lineup.includes('p1'));
  assert.equal(saved.lineup.length, 9);
  assert.equal(saved.roster.find((p) => p.id === 'bench').position, 'CF');
  assert.equal(saved.coins, 193);
  assert.equal(saved.tokens, 2);
  assert.equal(saved.stats.totalCoinsEarned, 313);
  assert.equal(saved.stats.gamesPlayed, 7);
  assert.deepEqual(saved.league.teams.find((t) => t.id === target).roster, [{ ...before.roster[0], transferPrice: 73 }]);
  assert.ok(saved.league.teams.filter((t) => t.id !== target).every((t) => !t.roster));
  assert.equal(offer(saved, 73, 0.1, 'p1', target).status, 'invalid');
  assert.deepEqual(profile, before);
});

test('a no changes no coins, lineup, player, or league; a lower offer can succeed', () => {
  const profile = makeProfile();
  const before = structuredClone(profile);
  assert.deepEqual(offer(profile, 100, 0.9), { status: 'declined' });
  assert.deepEqual(profile, before);
  assert.equal(offer(profile, 0, 0.9).status, 'accepted');
});

test('free transfers pay no coins and selling a bench player leaves field positions alone', () => {
  const profile = makeProfile();
  const { updates } = offer(profile, 0, 0.999, 'bench');
  assert.equal(updates.coins, 120);
  assert.deepEqual(updates.roster, starterRoster);
});

test('invalid offers and a nine-player roster cannot sell', () => {
  const profile = makeProfile();
  for (const price of [-1, 101, 1.5, NaN, '50', Infinity]) assert.equal(offer(profile, price).status, 'invalid');
  for (const roll of [-1, 1, NaN, Infinity]) assert.equal(offer(profile, 50, roll).status, 'invalid');
  for (const team of ['player', 'missing']) assert.equal(offer(profile, 50, 0, 'p1', team).status, 'invalid');
  assert.equal(offer(profile, 50, 0, 'missing').status, 'invalid');
  assert.equal(offer({ ...profile, roster: starterRoster }).status, 'invalid');
});

test('replayed sales stay blocked even when more than nine players remain', () => {
  const profile = makeProfile();
  profile.roster.push({ ...profile.roster[9], id: 'extra' });
  const saved = { ...profile, ...offer(profile, 100, 0.01).updates };
  assert.equal(saved.roster.length, 10);
  assert.equal(offer(saved, 100, 0.01).status, 'invalid');
  assert.equal(saved.coins, 220);
});

test('transfers survive game results, saving, and starting a new season', () => {
  let profile = makeProfile();
  profile = { ...profile, ...offer(profile, 50, 0).updates };
  const buyers = profile.league.teams[1].roster;
  for (let i = 0; i < 20; i++) {
    const next = getNextLeagueGame(profile);
    profile.league = recordLeagueGame(profile, { leagueRound: next.round, opponentId: next.opponent.id, playerScore: 2, aiScore: 1, seasonNumber: next.seasonNumber });
  }
  profile.league = startNextLeagueSeason(profile);
  profile = JSON.parse(JSON.stringify(profile));
  assert.deepEqual(profile.league.teams[1].roster, buyers);
  assert.equal(profile.league.seasonNumber, 2);
  assert.equal(profile.coins, 170);
});
