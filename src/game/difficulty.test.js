import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIFFICULTY_OPTIONS, getGameDifficulty, swingTiming } from './gameSettings.js';
import { createGameState, pitchDurationMs, calculateDefensePitchResult, resolveBattingSwing, PITCH_TYPES } from './GameEngine.js';

test('old saves and unknown settings default to Easy; all four levels persist', () => {
  for (const gameDifficulty of [undefined, null, '', 'invalid', '__proto__', 3]) {
    assert.equal(getGameDifficulty({ gameDifficulty }).id, 'easy');
  }
  assert.deepEqual(DIFFICULTY_OPTIONS.map((d) => d.label), ['Easy', 'Medium', 'Hard', 'Pro']);
  for (const { id } of DIFFICULTY_OPTIONS) {
    const profile = JSON.parse(JSON.stringify({ gameDifficulty: id, lineup: [], roster: [], coins: 73 }));
    const state = createGameState(profile);
    assert.equal(state.difficulty, id);
    profile.gameDifficulty = 'invalid';
    assert.equal(state.difficulty, id);
    assert.equal(profile.coins, 73);
  }
});

test('every level speeds up every pitch, including earned CPU Fireballs', () => {
  for (const average of [2, 4, 7, 10]) {
    for (const speed of [...Object.values(PITCH_TYPES).map((p) => p.speedMul), 0.34]) {
      const durations = DIFFICULTY_OPTIONS.map(({ id }) => pitchDurationMs(average, speed, id));
      assert.ok(durations.every((duration) => duration > 0));
      for (let i = 1; i < durations.length; i++) assert.ok(durations[i] < durations[i - 1]);
    }
  }
  assert.equal(pitchDurationMs(3), 2400);
  assert.equal(pitchDurationMs(9), 1200);
  assert.equal(pitchDurationMs(3, 1, 'pro'), 1320);
});

test('harder levels penalize early and late swings more; perfect timing stays perfect', () => {
  for (const offset of [-0.15, 0.15]) {
    const timings = DIFFICULTY_OPTIONS.map(({ id }) => swingTiming(offset, id));
    for (let i = 1; i < timings.length; i++) assert.ok(timings[i] > timings[i - 1]);
  }
  for (const { id } of DIFFICULTY_OPTIONS) {
    assert.equal(swingTiming(0, id), 0);
    assert.equal(swingTiming(10, id), 1);
  }
  assert.equal(swingTiming(0.325), 0.5);
});

test('opponents miss less and hit harder as difficulty rises across all pitch types', (t) => {
  for (const type of ['Slow Curve', 'Fastball', 'Slider']) {
    const results = DIFFICULTY_OPTIONS.map(({ id }) => {
      let seed = 123456;
      t.mock.method(Math, 'random', () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      });
      let strikes = 0;
      let bases = 0;
      for (let i = 0; i < 10000; i++) {
        const result = calculateDefensePitchResult(type, { x: 0.45, y: 0.2 }, id);
        if (result.kind.startsWith('strike')) strikes++;
        bases += { single: 1, double: 2, homerun: 4 }[result.kind] || 0;
      }
      t.mock.restoreAll();
      return { strikes, bases };
    });
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i].strikes < results[i - 1].strikes, `${type}: strikes`);
      assert.ok(results[i].bases > results[i - 1].bases, `${type}: bases`);
    }
  }
});

test('Easy retains the old defense outcome and bunts keep their agreed odds on every level', (t) => {
  t.mock.method(Math, 'random', () => 0.5);
  assert.deepEqual(calculateDefensePitchResult('Fastball', { x: 0.8, y: 0 }), calculateDefensePitchResult('Fastball', { x: 0.8, y: 0 }, 'easy'));
  for (const { id } of DIFFICULTY_OPTIONS) {
    let hits = 0;
    for (let roll = 0; roll < 100; roll++) {
      t.mock.method(Math, 'random', () => roll / 100);
      const swing = resolveBattingSwing(swingTiming(0.4, id), { x: 0, y: 0 }, { batting: 3 }, 'bunt', 0, false);
      if (swing.result.type === 'single') hits++;
    }
    assert.equal(hits, 75);
  }
});
