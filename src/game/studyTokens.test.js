import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creditStudyTokens, getStudyTokenProgress } from './studyTokens.js';

const answers = (values) => values.map((correct) => ({ correct }));

test('the fifth right answer earns a token immediately; ten right answers earn two', () => {
  assert.deepEqual(getStudyTokenProgress(0, answers([true, true, true, true])), { streak: 4, tokensEarned: 0 });
  assert.deepEqual(getStudyTokenProgress(0, answers(Array(5).fill(true))), { streak: 0, tokensEarned: 1 });
  assert.deepEqual(getStudyTokenProgress(0, answers(Array(10).fill(true))), { streak: 0, tokensEarned: 2 });
});

test('a wrong answer resets the streak without removing already earned tokens', () => {
  assert.deepEqual(getStudyTokenProgress(0, answers([true, true, true, true, false, true])), { streak: 1, tokensEarned: 0 });
  assert.deepEqual(getStudyTokenProgress(0, answers([true, true, true, true, true, false, true])), { streak: 1, tokensEarned: 1 });
});

test('a streak carries across inning quizzes and into bonus questions', () => {
  const first = getStudyTokenProgress(0, answers([false, true, true, true, true]));
  assert.equal(first.streak, 4);
  const second = getStudyTokenProgress(first.streak, answers([true, true, true, true, true]));
  assert.deepEqual(second, { streak: 4, tokensEarned: 1 });
  const bonus = getStudyTokenProgress(second.streak, answers([true]));
  assert.deepEqual(bonus, { streak: 0, tokensEarned: 1 });
});

test('tokens persist before quiz/game completion and repeated settlement never pays twice', () => {
  const original = { tokens: 2, coins: 50, roster: [{ id: 'batter' }] };
  const earned = creditStudyTokens(original, 'game-1', 1);
  assert.equal(earned.tokens, 3);
  assert.equal(original.tokens, 2);
  const reloaded = JSON.parse(JSON.stringify(earned));
  assert.strictEqual(creditStudyTokens(reloaded, 'game-1', 1), reloaded);
  const secondToken = creditStudyTokens(reloaded, 'game-1', 2);
  assert.equal(secondToken.tokens, 4);
  assert.strictEqual(creditStudyTokens(secondToken, 'game-1', 1), secondToken);
  assert.strictEqual(creditStudyTokens(secondToken, 'game-1', 2), secondToken);
  assert.equal(secondToken.coins, 50);
  assert.deepEqual(secondToken.roster, original.roster);
});

test('finishing a game does not refund tokens that were already credited and spent', () => {
  let p = creditStudyTokens({ tokens: 0 }, 'game-1', 2);
  p = { ...p, tokens: 0 };
  assert.strictEqual(creditStudyTokens(p, 'game-1', 2), p);
  assert.equal(p.tokens, 0);
});

test('different games each earn their own tokens without mixing profiles', () => {
  const first = creditStudyTokens({ tokens: 0 }, 'game-1', 1);
  const second = creditStudyTokens(first, 'game-2', 1);
  assert.equal(second.tokens, 2);
  assert.strictEqual(creditStudyTokens(second, 'game-1', 1), second);
  const otherProfile = creditStudyTokens({ tokens: 0 }, 'game-1', 1);
  assert.equal(otherProfile.tokens, 1);
});

test('zero, negative, missing, and invalid reward totals cannot change a wallet', () => {
  const p = { tokens: 4 };
  for (const total of [0, -1, 1.5, NaN, Infinity, undefined]) {
    assert.strictEqual(creditStudyTokens(p, 'game-1', total), p);
  }
  assert.strictEqual(creditStudyTokens(p, '', 1), p);
});
