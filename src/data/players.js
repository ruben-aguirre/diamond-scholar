// Starting roster - 9 average players (stats 3-5 range)
export const starterRoster = [
  { id: 'p1', name: 'Mick Trotter', batting: 5, pitching: 3, fielding: 5, speed: 5, position: 'CF', tier: 'starter' },
  { id: 'p2', name: 'Cookie Betts', batting: 4, pitching: 3, fielding: 5, speed: 4, position: 'RF', tier: 'starter' },
  { id: 'p3', name: 'Sho Otani', batting: 5, pitching: 5, fielding: 3, speed: 4, position: 'P', tier: 'starter' },
  { id: 'p4', name: 'Fernando Torres Jr.', batting: 4, pitching: 2, fielding: 4, speed: 5, position: 'SS', tier: 'starter' },
  { id: 'p5', name: 'Freddy Friedman', batting: 4, pitching: 2, fielding: 4, speed: 3, position: '1B', tier: 'starter' },
  { id: 'p6', name: 'Manny Ramires', batting: 5, pitching: 2, fielding: 3, speed: 3, position: 'LF', tier: 'starter' },
  { id: 'p7', name: 'Nolan Arenato', batting: 4, pitching: 2, fielding: 5, speed: 3, position: '3B', tier: 'starter' },
  { id: 'p8', name: 'Jose Altuve Jr.', batting: 4, pitching: 2, fielding: 4, speed: 5, position: '2B', tier: 'starter' },
  { id: 'p9', name: 'Sal Perez', batting: 4, pitching: 2, fielding: 4, speed: 3, position: 'C', tier: 'starter' },
];

// Player pool for card packs
export const playerPool = {
  bronze: [
    { name: 'Danny Mendez', batting: 4, pitching: 3, fielding: 4, speed: 3 },
    { name: 'Kyle Tucker Jr.', batting: 5, pitching: 2, fielding: 3, speed: 4 },
    { name: 'Bo Bischoff', batting: 3, pitching: 4, fielding: 5, speed: 3 },
    { name: 'Luis Castilla', batting: 3, pitching: 5, fielding: 3, speed: 4 },
    { name: 'Jake Crosby', batting: 4, pitching: 3, fielding: 3, speed: 6 },
    { name: 'Will Smythe', batting: 6, pitching: 2, fielding: 3, speed: 3 },
    { name: 'Marcus Johnson', batting: 3, pitching: 3, fielding: 6, speed: 4 },
    { name: 'Tyler Roe', batting: 4, pitching: 6, fielding: 3, speed: 3 },
  ],
  silver: [
    { name: 'Rafael De La Cruz', batting: 6, pitching: 3, fielding: 5, speed: 6 },
    { name: 'Bryce Hopper', batting: 7, pitching: 2, fielding: 5, speed: 5 },
    { name: 'Carlos Correal', batting: 5, pitching: 3, fielding: 7, speed: 6 },
    { name: 'Gerrit Kohl', batting: 3, pitching: 7, fielding: 4, speed: 5 },
    { name: 'Austin Ryley', batting: 6, pitching: 2, fielding: 6, speed: 5 },
    { name: 'Trea Turnbull', batting: 5, pitching: 3, fielding: 5, speed: 7 },
  ],
  gold: [
    { name: 'Juan Soto Jr.', batting: 8, pitching: 2, fielding: 6, speed: 7 },
    { name: 'Corey Seeger', batting: 7, pitching: 3, fielding: 8, speed: 7 },
    { name: 'Max Scherzo', batting: 3, pitching: 9, fielding: 5, speed: 5 },
    { name: 'Julio Rodrigo', batting: 7, pitching: 3, fielding: 7, speed: 9 },
    { name: 'Yordan Alvaroz', batting: 9, pitching: 2, fielding: 5, speed: 5 },
  ],
  diamond: [
    { name: 'Mookie Betts Jr.', batting: 9, pitching: 4, fielding: 9, speed: 8 },
    { name: 'Aaron Judd', batting: 10, pitching: 3, fielding: 7, speed: 7 },
    { name: 'Ronaldo Acuna Jr.', batting: 9, pitching: 3, fielding: 8, speed: 10 },
    { name: 'Mike Troutman', batting: 9, pitching: 4, fielding: 8, speed: 9 },
  ],
};

export const packPrices = {
  bronze: { cost: 100, sellPrice: 30 },
  silver: { cost: 300, sellPrice: 100 },
  gold: { cost: 750, sellPrice: 250 },
  diamond: { cost: 2000, sellPrice: 700 },
};

// A player's overall rating — the average of their four stats, rounded to
// one decimal so kids can compare players at a glance (e.g. 4.3 vs 5.8).
export function playerAverage(player) {
  const avg = (player.batting + player.pitching + player.fielding + player.speed) / 4;
  return Math.round(avg * 10) / 10;
}

// A player's batting average — real hits / at-bats, formatted like a baseball
// card (".312", ".000" before any at-bats, "1.000" if they're perfect).
// careerHits / careerAB accumulate across every game the player has batted in.
export function battingAverage(player) {
  const ab = player.careerAB || 0;
  const hits = player.careerHits || 0;
  if (ab === 0) return '.000';
  const avg = hits / ab;
  // Baseball convention: no leading zero, three decimals. 1.000 keeps its 1.
  const str = avg.toFixed(3);
  return avg < 1 ? str.slice(1) : str; // "0.312" -> ".312", "1.000" stays
}

export function createPlayerId() {
  return 'p' + Date.now() + Math.random().toString(36).substr(2, 5);
}

export function createPlayerFromPool(tier) {
  const pool = playerPool[tier];
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: createPlayerId(),
    ...template,
    tier,
    position: null, // unassigned until placed
  };
}
