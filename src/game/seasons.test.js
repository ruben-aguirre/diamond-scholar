import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canClaimSeasonalPack, claimSeasonalPack, getSeason } from './seasons.js';

const profile = { coins: 0, roster: [{ name: 'Existing Player' }] };
const halloween = getSeason(new Date(2026, 9, 8));
const christmas = getSeason(new Date(2026, 11, 25));
const makePlayer = () => ({ id: 'gift-player', name: 'Gold Player', tier: 'gold' });

test('Halloween runs October 1–31; Christmas runs December 1–31', () => {
  for (const [month, day, expected] of [
    [8, 30, null], [9, 1, 'halloween'], [9, 31, 'halloween'],
    [10, 1, null], [10, 30, null], [11, 1, 'christmas'], [11, 31, 'christmas'], [0, 1, null],
  ]) {
    assert.equal(getSeason(new Date(2026, month, day))?.id ?? null, expected);
  }
});

test('a holiday gift is a Gold Pack and costs no coins', () => {
  const gift = claimSeasonalPack(profile, halloween, (tier, names) => {
    assert.equal(tier, 'gold');
    assert.deepEqual(names, ['Existing Player']);
    return makePlayer();
  });
  const updated = { ...profile, ...gift };
  assert.equal(updated.coins, 0);
  assert.equal(updated.seasonalPackReveal.tier, 'gold');
  assert.equal(profile.seasonalPackClaims, undefined);
});

test('refreshing preserves the card and blocks another claim', () => {
  const updated = { ...profile, ...claimSeasonalPack(profile, halloween, makePlayer) };
  const reloaded = JSON.parse(JSON.stringify(updated));
  assert.deepEqual(reloaded.seasonalPackReveal.player, makePlayer());
  assert.equal(claimSeasonalPack(reloaded, halloween, makePlayer), null);
  reloaded.seasonalPackReveal = null;
  assert.equal(canClaimSeasonalPack(reloaded, halloween), false);
});

test('each player gets a separate gift for each holiday and each year', () => {
  const claimed = {
    ...profile, ...claimSeasonalPack(profile, halloween, makePlayer), seasonalPackReveal: null,
  };
  assert.equal(canClaimSeasonalPack(claimed, christmas), true);
  assert.equal(canClaimSeasonalPack(claimed, getSeason(new Date(2027, 9, 1))), true);
  assert.equal(canClaimSeasonalPack(profile, halloween), true);
});

test('no out-of-season claims; an unfinished gift survives the season ending', () => {
  assert.equal(claimSeasonalPack(profile, null, makePlayer), null);
  const pending = { ...profile, ...claimSeasonalPack(profile, halloween, makePlayer) };
  assert.equal(canClaimSeasonalPack(pending, christmas), false);
  assert.equal(pending.seasonalPackReveal.player.id, 'gift-player');
});

test('a full team can open a saved reward without replacing anyone automatically', () => {
  const fullTeam = { ...profile, roster: Array.from({ length: 12 }, (_, i) => ({ name: `Player ${i}` })) };
  const updated = { ...fullTeam, ...claimSeasonalPack(fullTeam, christmas, makePlayer) };
  assert.equal(updated.roster.length, 12);
  assert.equal(updated.seasonalPackReveal.player.id, 'gift-player');
});
