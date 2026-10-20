export const INNING_OPTIONS = [1, 3, 9];

export function getGameInnings(profile) {
  return INNING_OPTIONS.includes(profile.gameInnings) ? profile.gameInnings : 3;
}
