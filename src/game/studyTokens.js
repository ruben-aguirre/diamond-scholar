export function getStudyTokenProgress(startingStreak = 0, answers = []) {
  let streak = startingStreak;
  let tokensEarned = 0;
  for (const answer of answers) {
    if (!answer.correct) {
      streak = 0;
      continue;
    }
    streak += 1;
    if (streak >= 5) {
      tokensEarned += 1;
      streak = 0;
    }
  }
  return { streak, tokensEarned };
}

// Each game reports its cumulative earned total. Retrying, refreshing, or
// settling that same total at game end cannot pay the same token twice.
export function creditStudyTokens(profile, gameId, totalEarned) {
  if (!gameId || !Number.isInteger(totalEarned) || totalEarned <= 0) return profile;
  const credited = profile.studyTokenReceipts?.[gameId] || 0;
  if (totalEarned <= credited) return profile;
  return {
    ...profile,
    tokens: (profile.tokens || 0) + totalEarned - credited,
    studyTokenReceipts: { ...profile.studyTokenReceipts, [gameId]: totalEarned },
  };
}
