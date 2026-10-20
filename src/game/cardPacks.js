import { createPlayerFromPool, packPrices } from '../data/players.js';

export const MAX_TEAM = 12;

export function getPendingPack(profile) {
  return profile.shopPackReveal || profile.seasonalPackReveal || null;
}

export function purchasePack(profile, tier, currency = 'coins', makePlayer = createPlayerFromPool) {
  const price = packPrices[tier];
  if (!price || getPendingPack(profile) || !['coins', 'tokens'].includes(currency)) return null;
  const cost = currency === 'tokens' ? price.tokenCost : price.cost;
  if (cost == null || (profile[currency] || 0) < cost) return null;
  return {
    [currency]: profile[currency] - cost,
    shopPackReveal: {
      player: makePlayer(tier, profile.roster.map((player) => player.name)),
      tier,
      cost,
      currency,
    },
  };
}

// Finish the saved purchase in one update. A cleared purchase cannot be
// refunded or added twice. Free holiday packs never return coins.
export function resolvePackChoice(profile, playerId, keep, replaceId = null) {
  const pack = getPendingPack(profile);
  if (!pack || pack.player.id !== playerId) return null;
  const paid = Boolean(profile.shopPackReveal);
  const cleared = { [paid ? 'shopPackReveal' : 'seasonalPackReveal']: null };
  if (!keep) {
    if (!paid) return cleared;
    // Older purchases did not store currency; those were always coins.
    const currency = pack.currency === 'tokens' ? 'tokens' : 'coins';
    return { ...cleared, [currency]: (profile[currency] || 0) + pack.cost };
  }
  if (profile.roster.length >= MAX_TEAM) {
    if (!profile.roster.some((player) => player.id === replaceId)) return null;
    return {
      ...cleared,
      roster: profile.roster.map((player) => player.id === replaceId ? pack.player : player),
      lineup: (profile.lineup || []).map((id) => id === replaceId ? pack.player.id : id),
    };
  }
  return {
    ...cleared,
    roster: [...profile.roster, pack.player],
    lineup: [...(profile.lineup || []), pack.player.id],
  };
}
