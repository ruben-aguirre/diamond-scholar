import { getLeague, PLAYER_TEAM_ID } from './league.js';

export const MIN_ROSTER = 9;

export function saleAcceptanceChance(price) {
  return Number.isInteger(price) && price >= 0 && price <= 100 ? 1 - price * 0.009 : 0;
}

// The caller rolls once, outside React's state updater, so retries keep the same answer.
export function offerPlayer(profile, playerId, teamId, price, roll) {
  const league = getLeague(profile);
  const player = profile.roster.find((p) => p.id === playerId);
  const team = league.teams.find((t) => t.id === teamId && t.id !== PLAYER_TEAM_ID);
  if (!player || !team || profile.roster.length <= MIN_ROSTER
    || !Number.isInteger(price) || price < 0 || price > 100
    || !Number.isFinite(roll) || roll < 0 || roll >= 1
    || league.teams.some((t) => t.roster?.some((p) => p.id === playerId))) {
    return { status: 'invalid' };
  }
  if (roll >= saleAcceptanceChance(price)) return { status: 'declined' };

  let roster = profile.roster.filter((p) => p.id !== playerId);
  // Move a bench player into the sold player's fielding position.
  const replacement = player.position && roster.find((p) => !p.position);
  if (replacement) roster = roster.map((p) => p.id === replacement.id ? { ...p, position: player.position } : p);
  return {
    status: 'accepted',
    updates: {
      roster,
      lineup: (profile.lineup || []).filter((id) => id !== playerId),
      coins: profile.coins + price,
      stats: { ...profile.stats, totalCoinsEarned: (profile.stats?.totalCoinsEarned || 0) + price },
      league: {
        ...league,
        teams: league.teams.map((t) => t.id === teamId
          ? { ...t, roster: [...(t.roster || []), { ...player, transferPrice: price }] } : t),
      },
    },
  };
}
