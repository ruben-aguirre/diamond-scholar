export const MATCHUP_DURATION_MS = 5000;

export function startMatchupCountdown(onTick, onComplete) {
  const deadline = Date.now() + MATCHUP_DURATION_MS;
  const interval = setInterval(() => {
    onTick(Math.max(1, Math.ceil((deadline - Date.now()) / 1000)));
  }, 1000);
  const timeout = setTimeout(() => {
    clearInterval(interval);
    onComplete();
  }, MATCHUP_DURATION_MS);
  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}
