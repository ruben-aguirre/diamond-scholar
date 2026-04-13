// Game state machine
export const GAME_PHASES = {
  PRE_GAME: 'PRE_GAME',
  BATTING: 'BATTING',
  PITCH_INCOMING: 'PITCH_INCOMING',
  SWING_RESULT: 'SWING_RESULT',
  PLAY_RESULT: 'PLAY_RESULT',
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
    isTopHalf: true, // true = player bats, false = AI bats
    outs: 0,
    strikes: 0,
    balls: 0,
    playerScore: 0,
    aiScore: 0,
    bases: [false, false, false], // 1st, 2nd, 3rd
    currentBatterIndex: 0,
    phase: GAME_PHASES.BATTING,
    lineup: profile.lineup.map((id) => profile.roster.find((p) => p.id === id)),
    studyBreakNumber: 0,
    coinsEarned: 0,
    studyBreakResults: [],
    pitchLocation: null,
    pitchType: null,
    swingTiming: null,
    lastPlayDescription: '',
    gameLog: [],
  };
}

export function generatePitch(aiDifficulty) {
  const types = ['Fastball', 'Curveball', 'Changeup', 'Slider'];
  const type = types[Math.floor(Math.random() * types.length)];

  // Location: 0 = center of zone, 1 = edge. >1 = ball
  const x = (Math.random() - 0.5) * 2; // -1 to 1
  const y = (Math.random() - 0.5) * 2; // -1 to 1

  // Ball probability increases with difficulty
  const isBall = Math.random() < 0.25 + (aiDifficulty * 0.03);

  return {
    type,
    x: isBall ? x * 1.5 : x * 0.8,
    y: isBall ? y * 1.5 : y * 0.8,
    speed: 0.5 + (aiDifficulty * 0.05), // affects timing window
    isStrike: !isBall,
  };
}

export function calculateSwingResult(timing, pitch, batter) {
  // timing: 0 = perfect, higher = worse (0-1 scale)
  // Returns: hit type or miss

  const contactChance = (batter.batting / 10) * (1 - timing * 0.8);

  if (timing > 0.7 || Math.random() > contactChance) {
    return { type: 'miss', description: 'Swing and a miss!' };
  }

  if (timing > 0.5) {
    return Math.random() < 0.6
      ? { type: 'foul', description: 'Foul ball!' }
      : { type: 'groundout', description: 'Ground ball... out!', isOut: true };
  }

  // Good contact - determine outcome
  const quality = (1 - timing) * (batter.batting / 10);
  const roll = Math.random();

  if (quality > 0.85 && roll < 0.3) {
    return { type: 'homerun', description: 'HOME RUN!', bases: 4 };
  }
  if (quality > 0.7 && roll < 0.3) {
    return { type: 'triple', description: 'Triple! All the way to the wall!', bases: 3 };
  }
  if (quality > 0.5 && roll < 0.4) {
    return { type: 'double', description: 'Double! Into the gap!', bases: 2 };
  }
  if (roll < 0.55) {
    return { type: 'single', description: 'Base hit!', bases: 1 };
  }
  if (roll < 0.75) {
    return { type: 'flyout', description: 'Fly ball... caught! Out!', isOut: true };
  }
  return { type: 'groundout', description: 'Grounder... thrown out!', isOut: true };
}

export function advanceRunners(bases, hitBases) {
  let runs = 0;
  const newBases = [false, false, false];

  if (hitBases === 4) {
    // Home run - all runners score
    runs = 1 + bases.filter(Boolean).length;
    return { newBases, runs };
  }

  // Move existing runners
  for (let i = 2; i >= 0; i--) {
    if (bases[i]) {
      const newPos = i + hitBases;
      if (newPos >= 3) {
        runs++;
      } else {
        newBases[newPos] = true;
      }
    }
  }

  // Place batter
  if (hitBases > 0 && hitBases < 4) {
    newBases[hitBases - 1] = true;
  }

  return { newBases, runs };
}

export function simulateAIHalfInning(playerTeamAvg) {
  // Simple simulation: AI gets 0-4 runs based on difficulty vs player defense
  const difficulty = Math.max(1, playerTeamAvg - 1); // AI slightly weaker than player
  let runs = 0;
  let hits = 0;
  let outs = 0;

  while (outs < 3) {
    const roll = Math.random();
    if (roll < 0.15 + difficulty * 0.02) {
      runs += Math.random() < 0.1 ? 2 : 1; // occasional multi-run hit
      hits++;
    } else if (roll < 0.65) {
      outs++;
    } else {
      hits++;
      if (Math.random() < 0.3) {
        // runner scores on a hit
        runs += 1;
      }
    }
  }

  return { runs: Math.min(runs, 5), hits, description: `AI scored ${runs} run${runs !== 1 ? 's' : ''} on ${hits} hit${hits !== 1 ? 's' : ''}` };
}

export function checkMercyRule(playerScore, aiScore) {
  return Math.abs(playerScore - aiScore) >= 7;
}

export function getTeamAverage(roster) {
  if (!roster.length) return 3;
  const total = roster.reduce((sum, p) => sum + p.batting + p.fielding + p.speed, 0);
  return total / (roster.length * 3);
}
