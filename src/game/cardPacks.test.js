import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPrices } from '../data/players.js';
import { getPendingPack, purchasePack, resolvePackChoice } from './cardPacks.js';
import { canClaimSeasonalPack, claimSeasonalPack } from './seasons.js';

const profile = { coins: 2000, roster: [{ id: 'old', name: 'Old Player' }], lineup: ['old'] };
const makePlayer = (tier) => ({ id: 'new', name: 'New Player', tier });
const buy = (original, tier, currency = 'coins') => ({ ...original, ...purchasePack(original, tier, currency, makePlayer) });

test('Don’t Keep refunds the exact price for every pack without changing the team', () => {
  for (const [tier, { cost }] of Object.entries(packPrices)) {
    const purchased = buy(profile, tier);
    assert.equal(purchased.coins, profile.coins - cost);
    const declined = { ...purchased, ...resolvePackChoice(purchased, 'new', false) };
    assert.equal(declined.coins, profile.coins);
    assert.deepEqual(declined.roster, profile.roster);
    assert.deepEqual(declined.lineup, profile.lineup);
    assert.equal(getPendingPack(declined), null);
    assert.equal(resolvePackChoice(declined, 'new', false), null);
  }
});

test('Keep adds the player and retains the pack charge', () => {
  const purchased = buy(profile, 'gold');
  const kept = { ...purchased, ...resolvePackChoice(purchased, 'new', true) };
  assert.equal(kept.coins, 1500);
  assert.equal(kept.roster.length, 2);
  assert.deepEqual(kept.lineup, ['old', 'new']);
  assert.equal(getPendingPack(kept), null);
  assert.equal(resolvePackChoice(kept, 'new', true), null);
  assert.equal(resolvePackChoice(kept, 'new', false), null);
});

test('refreshing restores the same card and its refund amount', () => {
  const reloaded = JSON.parse(JSON.stringify(buy(profile, 'diamond')));
  assert.equal(getPendingPack(reloaded).player.id, 'new');
  assert.equal(getPendingPack(reloaded).cost, 1050);
  const declined = { ...reloaded, ...resolvePackChoice(reloaded, 'new', false) };
  assert.equal(declined.coins, 2000);
});

test('a full team requires a replacement for Keep; declining refunds instead', () => {
  const full = { ...profile, roster: Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` })), lineup: ['p0', 'p1'] };
  const purchased = buy(full, 'silver');
  assert.equal(resolvePackChoice(purchased, 'new', true), null);
  assert.equal(resolvePackChoice(purchased, 'new', true, 'missing'), null);
  const kept = { ...purchased, ...resolvePackChoice(purchased, 'new', true, 'p0') };
  assert.equal(kept.roster.length, 12);
  assert.equal(kept.roster[0].id, 'new');
  assert.deepEqual(kept.lineup, ['new', 'p1']);
  assert.equal(kept.coins, 1750);
  const declined = { ...purchased, ...resolvePackChoice(purchased, 'new', false) };
  assert.equal(declined.coins, 2000);
  assert.deepEqual(declined.roster, full.roster);
});

test('free seasonal cards cannot produce a refund or another holiday claim', () => {
  const season = { key: '2026-halloween' };
  const gifted = { ...profile, ...claimSeasonalPack(profile, season, makePlayer) };
  const declined = { ...gifted, ...resolvePackChoice(gifted, 'new', false) };
  assert.equal(declined.coins, profile.coins);
  assert.equal(canClaimSeasonalPack(declined, season), false);
  assert.equal(getPendingPack(declined), null);
  const kept = { ...gifted, ...resolvePackChoice(gifted, 'new', true) };
  assert.equal(kept.coins, profile.coins);
  assert.equal(kept.roster.length, 2);
});

test('unaffordable or overlapping purchases and stale card choices are rejected', () => {
  assert.equal(purchasePack({ ...profile, coins: 99 }, 'bronze', 'coins', makePlayer), null);
  assert.equal(purchasePack(profile, 'invalid', 'coins', makePlayer), null);
  const purchased = buy(profile, 'bronze');
  assert.equal(purchasePack(purchased, 'gold', 'coins', makePlayer), null);
  assert.equal(canClaimSeasonalPack(purchased, { key: '2026-halloween' }), false);
  assert.equal(resolvePackChoice(purchased, 'stale-card', false), null);
});

test('Diamond Pack can cost exactly 1050 coins or exactly 3 tokens', () => {
  const coinPurchase = buy({ ...profile, coins: 1050, tokens: 3 }, 'diamond');
  assert.equal(coinPurchase.coins, 0);
  assert.equal(coinPurchase.tokens, 3);
  const tokenPurchase = buy({ ...profile, coins: 0, tokens: 3 }, 'diamond', 'tokens');
  assert.equal(tokenPurchase.coins, 0);
  assert.equal(tokenPurchase.tokens, 0);
  assert.equal(tokenPurchase.shopPackReveal.tier, 'diamond');
});

test('token purchases survive refresh and refund tokens, never coins', () => {
  const original = { ...profile, tokens: 5 };
  const reloaded = JSON.parse(JSON.stringify(buy(original, 'diamond', 'tokens')));
  assert.equal(reloaded.tokens, 2);
  assert.equal(reloaded.shopPackReveal.currency, 'tokens');
  const refunded = { ...reloaded, ...resolvePackChoice(reloaded, 'new', false) };
  assert.equal(refunded.tokens, 5);
  assert.equal(refunded.coins, profile.coins);
  assert.deepEqual(refunded.roster, profile.roster);
  assert.equal(resolvePackChoice(refunded, 'new', false), null);
});

test('keeping a token-paid card charges only tokens and adds the player', () => {
  const purchased = buy({ ...profile, tokens: 3 }, 'diamond', 'tokens');
  const kept = { ...purchased, ...resolvePackChoice(purchased, 'new', true) };
  assert.equal(kept.tokens, 0);
  assert.equal(kept.coins, profile.coins);
  assert.equal(kept.roster.length, 2);
  assert.equal(kept.shopPackReveal, null);
});

test('each payment method needs its own balance and tokens buy only Diamond Packs', () => {
  for (const tokens of [undefined, 0, 2]) {
    assert.equal(purchasePack({ ...profile, tokens }, 'diamond', 'tokens', makePlayer), null);
  }
  assert.equal(purchasePack({ ...profile, coins: 1049, tokens: 3 }, 'diamond', 'coins', makePlayer), null);
  assert.equal(purchasePack({ ...profile, tokens: 10 }, 'gold', 'tokens', makePlayer), null);
  assert.equal(purchasePack(profile, 'diamond', 'invalid', makePlayer), null);
});

test('older paid packs refund the original stored coin price', () => {
  const legacy = { ...profile, coins: 500, shopPackReveal: { player: makePlayer('diamond'), tier: 'diamond', cost: 1500 } };
  assert.equal(resolvePackChoice(legacy, 'new', false).coins, 2000);
});
