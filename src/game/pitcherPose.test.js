import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPitcherPose } from './pitcherPose.js';

test('the ready pitcher holds the ball until the instant a pitch starts', () => {
  assert.deepEqual(getPitcherPose({ ready: true, now: 1000 }), { hasBall: true, throwProgress: 0 });
  assert.deepEqual(getPitcherPose({ ready: true, pitch: { startTime: 1000 }, now: 1000 }), { hasBall: false, throwProgress: 0 });
});

test('normal, defense, and fireball pitches all leave the throwing hand empty', () => {
  for (const pitchType of [{}, { defense: true }, { fireball: true }, { defense: true, fireball: true }]) {
    const pose = getPitcherPose({ ready: true, pitch: { startTime: 1000, pitch: pitchType }, now: 1130 });
    assert.equal(pose.hasBall, false);
    assert.equal(pose.throwProgress, 0.5);
  }
});

test('a ball in play and a completed at-bat do not duplicate a ball in the hand', () => {
  assert.equal(getPitcherPose({ ready: true, hitBall: {}, now: 2000 }).hasBall, false);
  assert.equal(getPitcherPose({ ready: false, now: 2000 }).hasBall, false);
  assert.equal(getPitcherPose({ ready: true, now: 2000 }).hasBall, true);
});

test('the throwing motion stops at its final pose', () => {
  assert.equal(getPitcherPose({ ready: false, pitch: { startTime: 1000 }, now: 3000 }).throwProgress, 1);
});
