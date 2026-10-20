import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceRunners, createGameState, resolveBattingSwing, getPostStudyPhase, GAME_PHASES } from './GameEngine.js';

const pitch = { x: 0, y: 0 };
const batter = { batting: 3 };

function rolls(t, values) {
  let index = 0;
  t.mock.method(Math, 'random', () => values[index++ % values.length]);
}

test('a regular home run earns two uses, capped at two', (t) => {
  rolls(t, [0]);
  for (const uses of [0, 1, 2]) {
    const swing = resolveBattingSwing(0, pitch, { batting: 10 }, 'normal', uses, false);
    assert.equal(swing.result.type, 'homerun');
    assert.equal(swing.diamondBatUses, 2);
  }
});

test('two misses exhaust Diamond Bat; a third swing gets no boost', (t) => {
  rolls(t, [0.99]);
  let uses = 2;
  for (const expected of [1, 0]) {
    const swing = resolveBattingSwing(0, pitch, batter, 'normal', uses, true);
    assert.equal(swing.result.type, 'miss');
    assert.equal(swing.usedDiamondBat, true);
    assert.equal(swing.diamondBatUses, expected);
    uses = swing.diamondBatUses;
  }
  rolls(t, [0, 0.7]);
  const swing = resolveBattingSwing(0, pitch, batter, 'normal', uses, true);
  assert.equal(swing.result.type, 'single');
  assert.equal(swing.usedDiamondBat, false);
  assert.equal(swing.diamondBatUses, 0);
});

test('Diamond Bat converts singles and fair contact outs into home runs', (t) => {
  for (const [timing, randoms] of [[0, [0, 0.7]], [0, [0, 0.9]], [0.7, [0, 0.9]]]) {
    rolls(t, randoms);
    const swing = resolveBattingSwing(timing, pitch, batter, 'normal', 2, true);
    assert.equal(swing.result.type, 'homerun');
    assert.equal(swing.result.bases, 4);
    assert.equal(swing.result.isOut, undefined);
    assert.equal(swing.diamondBatUses, 1);
  }
});

test('foul balls stay foul and consume both Diamond Bat uses', (t) => {
  rolls(t, [0]);
  let uses = 2;
  for (const expected of [1, 0]) {
    const swing = resolveBattingSwing(0.7, pitch, batter, 'normal', uses, true);
    assert.equal(swing.result.type, 'foul');
    assert.equal(swing.result.bases, undefined);
    assert.equal(swing.usedDiamondBat, true);
    assert.equal(swing.diamondBatUses, expected);
    uses = swing.diamondBatUses;
  }
});

test('boosted home runs consume both uses without refilling and score all runners', (t) => {
  rolls(t, [0]);
  let uses = 2;
  for (const expected of [1, 0]) {
    const swing = resolveBattingSwing(0, pitch, { batting: 10 }, 'power', uses, true);
    assert.equal(swing.result.type, 'homerun');
    assert.equal(swing.diamondBatUses, expected);
    assert.deepEqual(advanceRunners([true, true, true], swing.result.bases), {
      newBases: [false, false, false], runs: 4,
    });
    uses = swing.diamondBatUses;
  }
});

test('unequipped swings preserve saved uses', (t) => {
  rolls(t, [0, 0.7]);
  const swing = resolveBattingSwing(0, pitch, batter, 'normal', 2, false);
  assert.equal(swing.result.type, 'single');
  assert.equal(swing.diamondBatUses, 2);
});

test('bunts still connect 75% of the time with or without Diamond Bat', (t) => {
  for (const equipped of [false, true]) {
    for (const timing of [0, 0.5, 1]) {
      for (let roll = 0; roll < 100; roll++) {
        rolls(t, [roll / 100]);
        const swing = resolveBattingSwing(timing, pitch, batter, 'bunt', 2, equipped);
        assert.equal(swing.result.type, roll < 75 ? (equipped ? 'homerun' : 'single') : 'miss');
        assert.equal(swing.diamondBatUses, equipped ? 1 : 2);
      }
    }
  }
});

test('new and saved profiles initialize the correct number of uses', () => {
  const profile = { lineup: [], roster: [] };
  assert.equal(createGameState(profile).diamondBatUses, 0);
  assert.equal(createGameState({ ...profile, diamondBatUses: 1 }).diamondBatUses, 1);
  assert.equal(createGameState({ ...profile, diamondBatUses: 0 }).diamondBatUses, 0);
});

test('game length defaults to three and accepts only 1, 3, or 9 innings', () => {
  for (const [setting, expected] of [[undefined, 3], [null, 3], [0, 3], [2, 3], ['9', 3], [1, 1], [3, 3], [9, 9]]) {
    const saved = JSON.parse(JSON.stringify({ lineup: [], roster: [], gameInnings: setting }));
    assert.equal(createGameState(saved).totalInnings, expected);
  }
});

test('all selected lengths continue until the final inning, then finish or offer the bonus', () => {
  for (const totalInnings of [1, 3, 9]) {
    const game = createGameState({ lineup: [], roster: [], gameInnings: totalInnings });
    for (let inning = 1; inning < totalInnings; inning++) {
      assert.equal(getPostStudyPhase({ ...game, inning }, 5), GAME_PHASES.BATTING);
      assert.equal(getPostStudyPhase({ ...game, inning }, 0), GAME_PHASES.BATTING);
    }
    assert.equal(getPostStudyPhase({ ...game, inning: totalInnings }, 3), GAME_PHASES.GAME_OVER);
    assert.equal(getPostStudyPhase({ ...game, inning: totalInnings }, 4), GAME_PHASES.BONUS_ROUND);
  }
});

test('changing a saved preference cannot change an already-started game', () => {
  const profile = { lineup: [], roster: [], gameInnings: 9 };
  const game = createGameState(profile);
  profile.gameInnings = 1;
  assert.equal(game.totalInnings, 9);
  assert.equal(createGameState(profile).totalInnings, 1);
});

test('the existing seven-run mercy rule still ends a game early', () => {
  const game = { inning: 2, totalInnings: 9, playerScore: 7, aiScore: 0 };
  assert.equal(getPostStudyPhase(game, 5), GAME_PHASES.GAME_OVER);
  assert.equal(getPostStudyPhase({ ...game, playerScore: 0, aiScore: 7 }, 3), GAME_PHASES.GAME_OVER);
});
