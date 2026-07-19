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
  silver: { cost: 250, sellPrice: 80 },
  gold: { cost: 500, sellPrice: 175 },
  diamond: { cost: 1500, sellPrice: 500 },
};

// A player's overall rating — the average of their four stats, rounded to
// one decimal so kids can compare players at a glance (e.g. 4.3 vs 5.8).
export function playerAverage(player) {
  const avg = (player.batting + player.pitching + player.fielding + player.speed) / 4;
  return Math.round(avg * 10) / 10;
}

// A player's batting average, shown baseball-card style (".312", ".000" to
// start). It's built from hit points that only go up: each single adds 10,
// double 20, triple 30, home run 60. Points are read as thousandths, so 10
// points shows as ".010". Outs never subtract, so the number only climbs.
// Caps at ".999" so the card formatting stays clean.
export function battingAverage(player) {
  const points = player.hitPoints || 0;
  const capped = Math.min(points, 999);
  return '.' + String(capped).padStart(3, '0'); // 10 -> ".010", 312 -> ".312"
}

export function createPlayerId() {
  return 'p' + Date.now() + Math.random().toString(36).substr(2, 5);
}

export function createPlayerFromPool(tier, ownedNames = []) {
  const pool = playerPool[tier];
  // Prefer players the team doesn't already have, so packs feel fresh.
  const owned = new Set(ownedNames);
  const fresh = pool.filter((p) => !owned.has(p.name));
  // If every player in this tier is already owned, fall back to the full pool
  // so a purchase never fails — you just might get a duplicate.
  const choices = fresh.length > 0 ? fresh : pool;
  const template = choices[Math.floor(Math.random() * choices.length)];
  return {
    id: createPlayerId(),
    ...template,
    tier,
    position: null, // unassigned until placed
  };
}
