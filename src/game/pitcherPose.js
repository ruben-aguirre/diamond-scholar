export function getPitcherPose({ ready, pitch, hitBall, now }) {
  const hasBall = ready && !pitch && !hitBall;
  return {
    hasBall,
    throwProgress: pitch
      ? Math.max(0, Math.min(1, (now - pitch.startTime) / 260))
      : hasBall ? 0 : 1,
  };
}
