export const INNING_OPTIONS = [1, 3, 9];

export const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy', description: 'Slower pitches. Lots of time to swing.', pitchSpeed: 1, timingWindow: 0.65, opponentWhiff: 1, opponentPower: 1 },
  { id: 'medium', label: 'Medium', description: 'Faster pitches. A bigger challenge.', pitchSpeed: 0.85, timingWindow: 0.5, opponentWhiff: 0.85, opponentPower: 1.12 },
  { id: 'hard', label: 'Hard', description: 'Quick pitches. Tougher hitters.', pitchSpeed: 0.7, timingWindow: 0.35, opponentWhiff: 0.65, opponentPower: 1.25 },
  { id: 'pro', label: 'Pro', description: 'Lightning-fast pitches. Bring your best!', pitchSpeed: 0.55, timingWindow: 0.22, opponentWhiff: 0.45, opponentPower: 1.4 },
];

export function getGameDifficulty(profile) {
  return DIFFICULTY_OPTIONS.find((option) => option.id === profile.gameDifficulty) || DIFFICULTY_OPTIONS[0];
}

export function swingTiming(rawOffset, difficulty = 'easy') {
  const { timingWindow } = getGameDifficulty({ gameDifficulty: difficulty });
  return Math.min(1, Math.abs(rawOffset) / timingWindow);
}

export function getGameInnings(profile) {
  return INNING_OPTIONS.includes(profile.gameInnings) ? profile.gameInnings : 3;
}
