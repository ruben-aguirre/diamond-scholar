// Game state machine
export const GAME_PHASES = {
  PRE_GAME: 'PRE_GAME',
  BATTING: 'BATTING',
  PITCH_INCOMING: 'PITCH_INCOMING',
  SWING_RESULT: 'SWING_RESULT',
  DID_YOU_KNOW: 'DID_YOU_KNOW',
  HALF_INNING_OVER: 'HALF_INNING_OVER',
  AI_BATTING: 'AI_BATTING',
  STUDY_BREAK: 'STUDY_BREAK',
  BONUS_ROUND: 'BONUS_ROUND',
  GAME_OVER: 'GAME_OVER',
};

export function createGameState(profile) {
  return {
    inning: 1,
    isTopHalf: true,
    outs: 0,
    strikes: 0,
    balls: 0,
    playerScore: 0,
    aiScore: 0,
    bases: [false, false, false],
    currentBatterIndex: 0,
    phase: GAME_PHASES.BATTING,
    lineup: profile.lineup.map((id) => profile.roster.find((p) => p.id === id)).filter(Boolean),
    studyBreakNumber: 0,
    coinsEarned: 0,
    studyBreakResults: [],
    pitchLocation: null,
    pitchType: null,
    lastPlayDescription: '',
  };
}

export function generatePitch(aiDifficulty) {
  const types = ['Fastball', 'Curveball', 'Changeup', 'Slider'];
  const type = types[Math.floor(Math.random() * types.length)];

  // Location in strike zone coords: -1..1 means edges of zone, >1 means outside
  const baseX = (Math.random() - 0.5) * 2;
  const baseY = (Math.random() - 0.5) * 2;

  // Ball probability tempered so early games feel fair (more strikes = more chances to swing)
  const isBall = Math.random() < 0.18 + aiDifficulty * 0.02;

  return {
    type,
    x: isBall ? baseX * 1.6 : baseX * 0.75,
    y: isBall ? baseY * 1.6 : baseY * 0.75,
    // speed is a scalar 0..1 used to pick pitch duration in ms
    speed: Math.min(1, 0.25 + aiDifficulty * 0.07),
    isStrike: !isBall,
  };
}

// Map team strength to pitch duration in ms (lower = faster = harder)
export function pitchDurationMs(teamAvg) {
  // Starts slow (~2400ms) at avg 3, ramps to ~1200ms at avg 9 — gentler curve
  const clamped = Math.max(2, Math.min(10, teamAvg));
  return Math.round(2400 - (clamped - 3) * 200);
}

// Swing type modifiers
// - normal: baseline
// - power: bigger payoff, more miss risk
// - bunt: tiny window, always soft contact if made
// - half: safer (no swinging strike on close pitches), less power
const SWING_PROFILES = {
  normal: { contactMul: 1.0, powerMul: 1.0, missMul: 1.0, label: 'Normal' },
  power:  { contactMul: 0.8, powerMul: 1.6, missMul: 1.4, label: 'Power' },
  bunt:   { contactMul: 0.6, powerMul: 0.3, missMul: 1.2, label: 'Bunt' },
  half:   { contactMul: 1.1, powerMul: 0.6, missMul: 0.6, label: 'Half Swing' },
};

export function calculateSwingResult(timing, pitch, batter, swingType = 'normal') {
  // timing: 0 = perfect, 1 = worst
  const profile = SWING_PROFILES[swingType] || SWING_PROFILES.normal;

  // Pitch in zone? Distance from zone center (0,0)
  const pitchDist = Math.sqrt(pitch.x * pitch.x + pitch.y * pitch.y);

  // Chasing a ball outside the zone increases miss chance (gentler than before)
  const chasePenalty = Math.max(0, pitchDist - 1) * 0.25;
  const effectiveTiming = Math.min(1, timing + chasePenalty);

  // Contact chance: floor of 0.4 so even bad batters aren't hopeless
  const rawContact = (0.45 + batter.batting / 14) * (1 - effectiveTiming * 0.6) * profile.contactMul;
  const contactChance = Math.max(0.4, Math.min(0.98, rawContact));

  // Bunt: any contact becomes a bunt-single if well-timed, else a foul or miss
  if (swingType === 'bunt') {
    if (effectiveTiming > 0.4 || Math.random() > contactChance) {
      return { type: 'miss', description: 'Missed the bunt!' };
    }
    if (effectiveTiming > 0.25) {
      return { type: 'foul', description: 'Bunt foul.' };
    }
    return { type: 'single', description: 'Bunt single!', bases: 1 };
  }

  // Only the truly awful swings whiff completely
  if (effectiveTiming > 0.92 * profile.missMul || Math.random() > contactChance) {
    return { type: 'miss', description: 'Swing and a miss!' };
  }

  // Rough timing → mostly fouls (which keep the at-bat alive) instead of outs
  if (effectiveTiming > 0.65) {
    return Math.random() < 0.75
      ? { type: 'foul', description: 'Foul ball!' }
      : { type: 'groundout', description: 'Grounder... out!', isOut: true };
  }

  const quality = (1 - effectiveTiming) * (batter.batting / 10) * profile.powerMul;
  const roll = Math.random();

  if (quality > 0.8 && roll < 0.35) {
    return { type: 'homerun', description: 'HOME RUN!', bases: 4 };
  }
  if (quality > 0.65 && roll < 0.35) {
    return { type: 'triple', description: 'Triple! To the wall!', bases: 3 };
  }
  if (quality > 0.45 && roll < 0.45) {
    return { type: 'double', description: 'Double! In the gap!', bases: 2 };
  }
  if (roll < 0.6) {
    return { type: 'single', description: 'Base hit!', bases: 1 };
  }
  if (roll < 0.78) {
    return { type: 'flyout', description: 'Fly ball... caught! Out!', isOut: true };
  }
  return { type: 'groundout', description: 'Grounder... thrown out!', isOut: true };
}

export function advanceRunners(bases, hitBases) {
  let runs = 0;
  const newBases = [false, false, false];

  if (hitBases === 4) {
    runs = 1 + bases.filter(Boolean).length;
    return { newBases, runs };
  }

  for (let i = 2; i >= 0; i--) {
    if (bases[i]) {
      const newPos = i + hitBases;
      if (newPos >= 3) runs++;
      else newBases[newPos] = true;
    }
  }

  if (hitBases > 0 && hitBases < 4) {
    newBases[hitBases - 1] = true;
  }

  return { newBases, runs };
}

// Step-by-step AI half-inning so kids can SEE defense happening.
// Returns an ordered list of plays that will be stepped through one tap at a time.
export function simulateAIHalfInningSteps(playerTeamAvg) {
  const difficulty = Math.max(1, playerTeamAvg - 1);
  const steps = [];
  let outs = 0;
  let bases = [false, false, false];
  let runs = 0;
  let runsThisInning = 0;
  let batter = 1;

  while (outs < 3 && steps.length < 12) {
    const roll = Math.random();
    let play;

    if (roll < 0.08 + difficulty * 0.015) {
      // Home run
      const r = 1 + bases.filter(Boolean).length;
      runs = r;
      runsThisInning += r;
      bases = [false, false, false];
      play = { description: `Batter ${batter}: HOME RUN! ${r} run${r > 1 ? 's' : ''} score.`, kind: 'hr' };
    } else if (roll < 0.18 + difficulty * 0.02) {
      // Extra-base hit (double)
      const { newBases, runs: r } = advanceRunners(bases, 2);
      bases = newBases;
      bases[1] = true; // batter to second
      runs = r;
      runsThisInning += r;
      play = { description: `Batter ${batter}: Double into the gap.${r ? ` ${r} scored.` : ''}`, kind: 'hit' };
    } else if (roll < 0.35 + difficulty * 0.02) {
      // Single
      const { newBases, runs: r } = advanceRunners(bases, 1);
      bases = newBases;
      runs = r;
      runsThisInning += r;
      play = { description: `Batter ${batter}: Line-drive single.${r ? ` ${r} scored.` : ''}`, kind: 'hit' };
    } else if (roll < 0.45) {
      // Walk
      const { newBases } = advanceRunners(bases, 1);
      bases = newBases;
      runs = 0;
      play = { description: `Batter ${batter}: Walk.`, kind: 'walk' };
    } else if (roll < 0.72) {
      outs++;
      runs = 0;
      play = { description: `Batter ${batter}: Grounded out.`, kind: 'out' };
    } else if (roll < 0.92) {
      outs++;
      runs = 0;
      play = { description: `Batter ${batter}: Fly ball, caught.`, kind: 'out' };
    } else {
      outs++;
      runs = 0;
      play = { description: `Batter ${batter}: Strikeout!`, kind: 'K' };
    }

    steps.push({
      ...play,
      runs,
      outs,
      bases: [...bases],
    });
    batter++;
  }

  // Force at least 3 outs
  while (outs < 3) {
    outs++;
    steps.push({
      description: `Batter ${batter}: Routine out.`,
      kind: 'out',
      runs: 0,
      outs,
      bases,
    });
    batter++;
  }

  return { steps, totalRuns: runsThisInning };
}

export function checkMercyRule(playerScore, aiScore) {
  return Math.abs(playerScore - aiScore) >= 7;
}

export function getTeamAverage(roster) {
  if (!roster.length) return 3;
  const total = roster.reduce((sum, p) => sum + p.batting + p.fielding + p.speed, 0);
  return total / (roster.length * 3);
}
