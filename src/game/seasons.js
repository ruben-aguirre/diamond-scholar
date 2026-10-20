import { createPlayerFromPool } from '../data/players.js';

// Use the player's local calendar. Each holiday returns every year.
export function getSeason(date = new Date()) {
  const month = date.getMonth();
  const id = month === 9 ? 'halloween' : month === 11 ? 'christmas' : null;
  if (!id) return null;
  return {
    id,
    key: `${date.getFullYear()}-${id}`,
    name: id === 'halloween' ? 'Halloween' : 'Christmas',
    emoji: id === 'halloween' ? '🎃' : '🎄',
  };
}

export function canClaimSeasonalPack(profile, season) {
  return Boolean(season && !profile.seasonalPackReveal && !profile.shopPackReveal
    && !(profile.seasonalPackClaims || []).includes(season.key));
}

export function claimSeasonalPack(profile, season, makePlayer = createPlayerFromPool) {
  if (!canClaimSeasonalPack(profile, season)) return null;
  return {
    seasonalPackClaims: [...(profile.seasonalPackClaims || []), season.key],
    // Save the actual card along with the claim so refreshing cannot lose it
    // or reroll it. The existing shop handles adding or swapping the player.
    seasonalPackReveal: {
      player: makePlayer('gold', profile.roster.map((player) => player.name)),
      tier: 'gold',
    },
  };
}
