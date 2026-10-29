import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startMatchupCountdown } from './matchupCountdown.js';

test('matchup counts 5 seconds before starting exactly once', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });
  const seconds = [];
  let starts = 0;
  startMatchupCountdown((value) => seconds.push(value), () => { starts += 1; });
  for (let second = 1; second <= 4; second += 1) {
    t.mock.timers.tick(1000);
    assert.equal(seconds.at(-1), 5 - second);
    assert.equal(starts, 0);
  }
  t.mock.timers.tick(999);
  assert.equal(starts, 0);
  t.mock.timers.tick(1);
  assert.equal(starts, 1);
  const ticks = seconds.length;
  t.mock.timers.tick(10000);
  assert.equal(starts, 1);
  assert.equal(seconds.length, ticks);
});

test('leaving the matchup cancels both countdown and game start', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });
  let ticks = 0;
  let starts = 0;
  const cancel = startMatchupCountdown(() => { ticks += 1; }, () => { starts += 1; });
  t.mock.timers.tick(2000);
  const before = ticks;
  cancel();
  t.mock.timers.tick(10000);
  assert.equal(ticks, before);
  assert.equal(starts, 0);
});

test('a new countdown gets a full five seconds after cancellation', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });
  let starts = 0;
  const cancel = startMatchupCountdown(() => {}, () => { starts += 1; });
  t.mock.timers.tick(3000);
  cancel();
  startMatchupCountdown(() => {}, () => { starts += 1; });
  t.mock.timers.tick(4999);
  assert.equal(starts, 0);
  t.mock.timers.tick(1);
  assert.equal(starts, 1);
});
