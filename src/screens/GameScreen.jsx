import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GAME_PHASES,
  createGameState,
  generatePitch,
  pitchDurationMs,
  calculateSwingResult,
  advanceRunners,
  simulateAIHalfInningSteps,
  checkMercyRule,
  getTeamAverage,
} from '../game/GameEngine';
import StudyBreak from './StudyBreak';
import DidYouKnowCard from './DidYouKnowCard';
import scienceQuestions from '../data/questions/science-4th.json';

// Canvas internal drawing size
const CW = 800;
const CH = 500;

// Scene anchor points
const MOUND = { x: 560, y: 265 };
const PLATE = { x: 210, y: 430 };
const BATTER = { x: 165, y: 380 };
const ZONE = { cx: 210, cy: 355, w: 90, h: 100 }; // strike zone rectangle (center + size)

const SWING_TYPES = [
  { id: 'normal', label: 'Swing', color: '#3498db' },
  { id: 'power', label: 'Power', color: '#e67e22' },
  { id: 'bunt', label: 'Bunt', color: '#16a085' },
  { id: 'half', label: 'Half', color: '#8e44ad' },
];

function getRandomFact() {
  const facts = scienceQuestions.didYouKnow;
  return facts[Math.floor(Math.random() * facts.length)];
}

function getStudyQuestions(count = 5) {
  const pool = [...scienceQuestions.questions];
  const selected = [];
  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
}

// ---- Drawing ----

function drawSky(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CH * 0.6);
  grad.addColorStop(0, '#7CC6FF');
  grad.addColorStop(1, '#C8ECFF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH * 0.6);
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  [[120, 70, 55], [380, 55, 45], [640, 90, 60]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y + 4, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x - r * 0.7, y + 6, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOutfield(ctx) {
  // Outfield wall
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(0, CH * 0.48, CW, 22);
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(0, CH * 0.48 + 22, CW, 6);
  // Grass
  const grad = ctx.createLinearGradient(0, CH * 0.5, 0, CH);
  grad.addColorStop(0, '#5DBB4A');
  grad.addColorStop(1, '#3E9A2E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, CH * 0.5 + 10, CW, CH * 0.5);
  // Grass stripes
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) continue;
    ctx.fillRect(0, CH * 0.5 + 10 + i * 28, CW, 28);
  }
}

function drawInfield(ctx) {
  // Infield dirt arc around home
  ctx.fillStyle = '#D2A06B';
  ctx.beginPath();
  ctx.ellipse(PLATE.x + 180, PLATE.y + 20, 460, 180, 0, Math.PI, 0, true);
  ctx.fill();
  // Pitcher's mound
  ctx.fillStyle = '#C08B5C';
  ctx.beginPath();
  ctx.ellipse(MOUND.x, MOUND.y + 20, 55, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Home plate
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(PLATE.x - 30, PLATE.y);
  ctx.lineTo(PLATE.x + 30, PLATE.y);
  ctx.lineTo(PLATE.x + 30, PLATE.y + 14);
  ctx.lineTo(PLATE.x, PLATE.y + 26);
  ctx.lineTo(PLATE.x - 30, PLATE.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawStrikeZone(ctx) {
  const x = ZONE.cx - ZONE.w / 2;
  const y = ZONE.cy - ZONE.h / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, ZONE.w, ZONE.h);
  ctx.setLineDash([]);
  // Subtle fill
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, y, ZONE.w, ZONE.h);
  ctx.restore();
}

function drawPitcher(ctx, teamColor) {
  // Simple placeholder pitcher sprite (side view, small scale)
  const x = MOUND.x;
  const y = MOUND.y;
  // Legs
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 8, y + 4, 6, 22);
  ctx.fillRect(x + 2, y + 4, 6, 22);
  // Body
  ctx.fillStyle = teamColor || '#c0392b';
  ctx.fillRect(x - 10, y - 18, 20, 26);
  // Head
  ctx.fillStyle = '#F2C8A0';
  ctx.beginPath();
  ctx.arc(x, y - 25, 9, 0, Math.PI * 2);
  ctx.fill();
  // Cap
  ctx.fillStyle = teamColor || '#c0392b';
  ctx.beginPath();
  ctx.arc(x, y - 27, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 9, y - 27, 16, 3);
  // Cap brim
  ctx.fillRect(x - 14, y - 26, 8, 2);
  // Glove arm
  ctx.fillStyle = teamColor || '#c0392b';
  ctx.fillRect(x - 18, y - 10, 8, 14);
}

function drawCatcher(ctx) {
  const x = PLATE.x - 55;
  const y = PLATE.y - 18;
  ctx.fillStyle = '#5c6b73';
  ctx.fillRect(x - 10, y, 20, 26);
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x, y - 4, 10, 0, Math.PI * 2);
  ctx.fill();
  // Mitt
  ctx.fillStyle = '#6b4a2b';
  ctx.beginPath();
  ctx.arc(x + 18, y + 10, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawBatter(ctx, teamColor, batSwingT) {
  // batSwingT: 0 (cocked) .. 1 (extended), or null
  const x = BATTER.x;
  const y = BATTER.y;
  // Legs
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x - 9, y + 10, 8, 30);
  ctx.fillRect(x + 1, y + 10, 8, 30);
  // Body
  ctx.fillStyle = teamColor || '#1f3a93';
  ctx.fillRect(x - 14, y - 22, 28, 36);
  // Belt
  ctx.fillStyle = '#222';
  ctx.fillRect(x - 14, y + 10, 28, 4);
  // Head
  ctx.fillStyle = '#E7B691';
  ctx.beginPath();
  ctx.arc(x + 4, y - 32, 12, 0, Math.PI * 2);
  ctx.fill();
  // Helmet
  ctx.fillStyle = teamColor || '#1f3a93';
  ctx.beginPath();
  ctx.arc(x + 4, y - 34, 13, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();
  ctx.fillRect(x - 9, y - 36, 18, 4);
  // Front arm / back arm (holding bat)
  const handsX = x + 14;
  const handsY = y - 18;
  ctx.fillStyle = '#E7B691';
  ctx.fillRect(handsX - 3, handsY - 3, 10, 10);

  // Bat: rotates from cocked (-70deg) to extended (+70deg)
  const startAngle = -Math.PI * 0.55;
  const endAngle = Math.PI * 0.45;
  const t = batSwingT == null ? 0 : batSwingT; // at rest, cocked
  const angle = startAngle + (endAngle - startAngle) * t;

  ctx.save();
  ctx.translate(handsX + 2, handsY + 2);
  ctx.rotate(angle);
  // Bat handle
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(0, -3, 54, 6);
  // Bat barrel
  ctx.fillStyle = '#8B5E34';
  ctx.fillRect(42, -5, 18, 10);
  // Grip
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -3, 6, 6);
  ctx.restore();
}

function drawBall(ctx, x, y, size = 7) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Stitching hint
  ctx.beginPath();
  ctx.arc(x, y, size - 2, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}

function drawLandingMarker(ctx, targetX, targetY, strength) {
  // Glowing ring at predicted landing spot; strength grows as pitch nears plate
  ctx.save();
  const r = 10 + strength * 8;
  ctx.globalAlpha = 0.35 + strength * 0.45;
  ctx.strokeStyle = '#FFEA2B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#FFEA2B';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function computeLanding(pitch) {
  // pitch.x/y are normalized (-1..1 ≈ zone edge, outside = ball)
  return {
    x: ZONE.cx + pitch.x * (ZONE.w / 2),
    y: ZONE.cy + pitch.y * (ZONE.h / 2),
  };
}

function computeBallAt(pitch, t) {
  // Start at pitcher's hand, arc to landing point
  const land = computeLanding(pitch);
  const sx = MOUND.x - 10;
  const sy = MOUND.y - 18;
  const x = sx + (land.x - sx) * t;
  // Arc: parabolic lift in the middle
  const arc = Math.sin(t * Math.PI) * -28;
  const y = sy + (land.y - sy) * t + arc;
  const size = 5 + t * 4;
  return { x, y, size, land };
}

// ---- Component ----

export default function GameScreen({ profile, onGameEnd }) {
  const [game, setGame] = useState(() => createGameState(profile));
  const [swingType, setSwingType] = useState('normal');
  const [swingResult, setSwingResult] = useState(null);
  const [didYouKnow, setDidYouKnow] = useState(null);
  const [studyQuestions, setStudyQuestions] = useState(null);
  const [aiHalf, setAiHalf] = useState(null); // { steps, idx }

  const canvasRef = useRef(null);
  const pitchRef = useRef(null); // { pitch, startTime, duration, resolved, landing }
  const batRef = useRef(null); // { startTime, duration }
  const rafRef = useRef(null);

  const currentBatter = game.lineup[game.currentBatterIndex % game.lineup.length] || { name: '—', batting: 3 };
  const teamAvg = getTeamAverage(profile.roster);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let alive = true;

    const render = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, CW, CH);
      drawSky(ctx);
      drawOutfield(ctx);
      drawInfield(ctx);
      drawCatcher(ctx);

      // Strike zone (only during batting-ish phases)
      if (
        game.phase === GAME_PHASES.BATTING ||
        game.phase === GAME_PHASES.PITCH_INCOMING ||
        game.phase === GAME_PHASES.SWING_RESULT
      ) {
        drawStrikeZone(ctx);
      }

      drawPitcher(ctx, profile.teamColor?.primary);

      // Bat position
      let batT = null;
      if (batRef.current) {
        const bt = (Date.now() - batRef.current.startTime) / batRef.current.duration;
        if (bt >= 1) {
          batRef.current = null;
          batT = null;
        } else {
          batT = bt;
        }
      }
      drawBatter(ctx, profile.teamColor?.secondary || '#1f3a93', batT);

      // Pitch ball + landing marker
      if (pitchRef.current) {
        const p = pitchRef.current;
        const t = Math.min(1, (Date.now() - p.startTime) / p.duration);
        const ball = computeBallAt(p.pitch, t);
        drawLandingMarker(ctx, ball.land.x, ball.land.y, t);
        drawBall(ctx, ball.x, ball.y, ball.size);
        // Auto-resolve when pitch completes without a swing
        if (t >= 1 && !p.resolved) {
          p.resolved = true;
          pitchRef.current = null;
          if (p.pitch.isStrike) resolveStrike();
          else resolveBall();
        }
      }

      // Bases indicator (small diamond inset, top-right of canvas)
      drawBasesInset(ctx, game.bases, profile.teamColor?.primary || '#e74c3c');

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase, game.bases, profile.teamColor]);

  // ---- Pitch & swing ----

  function throwPitch() {
    const pitch = generatePitch(teamAvg);
    const duration = pitchDurationMs(teamAvg);
    pitchRef.current = { pitch, startTime: Date.now(), duration, resolved: false };
    setGame((g) => ({ ...g, phase: GAME_PHASES.PITCH_INCOMING, pitchLocation: pitch }));
  }

  const handleSwing = useCallback(() => {
    if (game.phase !== GAME_PHASES.PITCH_INCOMING) return;
    const p = pitchRef.current;
    if (!p || p.resolved) return;

    const t = (Date.now() - p.startTime) / p.duration;
    // Sweet spot centered at 0.85 (ball reaching plate)
    const timing = Math.min(1, Math.abs(t - 0.85) / 0.3);

    batRef.current = { startTime: Date.now(), duration: 260 };
    p.resolved = true;
    pitchRef.current = null;

    const result = calculateSwingResult(timing, p.pitch, currentBatter, swingType);
    setSwingResult(result);

    if (result.type === 'miss') {
      setTimeout(() => { setSwingResult(null); resolveStrike(); }, 1200);
      return;
    }
    if (result.type === 'foul') {
      setGame((g) => ({
        ...g,
        strikes: Math.min(g.strikes + 1, 2),
        phase: GAME_PHASES.SWING_RESULT,
      }));
      setTimeout(() => {
        setSwingResult(null);
        setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
      }, 1500);
      return;
    }
    if (result.isOut) {
      setGame((g) => ({ ...g, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT }));
      setTimeout(() => { setSwingResult(null); afterPlay(true); }, 1800);
      return;
    }
    // Hit
    setGame((g) => {
      const { newBases, runs } = advanceRunners(g.bases, result.bases);
      return {
        ...g,
        bases: newBases,
        playerScore: g.playerScore + runs,
        phase: GAME_PHASES.SWING_RESULT,
        lastPlayDescription: result.description + (runs > 0 ? ` ${runs} run${runs > 1 ? 's' : ''} scored!` : ''),
      };
    });
    setTimeout(() => { setSwingResult(null); afterPlay(false); }, 2200);
  }, [game.phase, currentBatter, swingType]);

  function resolveStrike() {
    setGame((g) => {
      const newStrikes = g.strikes + 1;
      if (newStrikes >= 3) {
        setSwingResult({ type: 'miss', description: 'STRIKE THREE — YOU\'RE OUT!' });
        setTimeout(() => {
          setSwingResult(null);
          afterPlay(true);
        }, 1400);
        return { ...g, strikes: 0, balls: 0, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT };
      }
      setSwingResult({ type: 'strike', description: 'Strike!' });
      setTimeout(() => setSwingResult(null), 900);
      return { ...g, strikes: newStrikes, phase: GAME_PHASES.BATTING };
    });
  }

  function resolveBall() {
    setGame((g) => {
      const newBalls = g.balls + 1;
      if (newBalls >= 4) {
        const { newBases, runs } = advanceRunners(g.bases, 1);
        setSwingResult({ type: 'walk', description: 'Ball four — take your base!' });
        setTimeout(() => { setSwingResult(null); afterPlay(false); }, 1500);
        return {
          ...g,
          balls: 0,
          strikes: 0,
          bases: newBases,
          playerScore: g.playerScore + runs,
          phase: GAME_PHASES.SWING_RESULT,
        };
      }
      setSwingResult({ type: 'ball', description: 'Ball!' });
      setTimeout(() => setSwingResult(null), 800);
      return { ...g, balls: newBalls, phase: GAME_PHASES.BATTING };
    });
  }

  function afterPlay(wasOut) {
    setGame((prev) => {
      if (prev.outs >= 3) {
        return { ...prev, phase: GAME_PHASES.HALF_INNING_OVER };
      }
      // Show Did You Know between batters
      setDidYouKnow(getRandomFact());
      return {
        ...prev,
        currentBatterIndex: prev.currentBatterIndex + 1,
        strikes: 0,
        balls: 0,
        phase: GAME_PHASES.DID_YOU_KNOW,
      };
    });
  }

  function closeDidYouKnow() {
    setDidYouKnow(null);
    setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
  }

  // ---- Half-inning transitions ----

  function startAiHalfInning() {
    const { steps } = simulateAIHalfInningSteps(teamAvg);
    setAiHalf({ steps, idx: 0, runs: 0, outs: 0, bases: [false, false, false] });
    setGame((g) => ({ ...g, phase: GAME_PHASES.AI_BATTING, isTopHalf: false, outs: 0, bases: [false, false, false], strikes: 0, balls: 0 }));
  }

  function advanceAiStep() {
    setAiHalf((h) => {
      if (!h) return h;
      const step = h.steps[h.idx];
      const runsAdded = step.runs || 0;
      setGame((g) => ({
        ...g,
        aiScore: g.aiScore + runsAdded,
        bases: step.bases,
        outs: step.outs,
      }));
      const nextIdx = h.idx + 1;
      if (nextIdx >= h.steps.length) {
        queueMicrotask(() => {
          setAiHalf(null);
          finishAiHalf();
        });
        return h; // stay on last visible step until transition
      }
      return { ...h, idx: nextIdx };
    });
  }

  function finishAiHalf() {
    setGame((prev) => {
      const mercy = prev.inning >= 1 && checkMercyRule(prev.playerScore, prev.aiScore);
      // Study break after every full inning (both halves complete)
      const breakNum = prev.studyBreakNumber + 1;
      setStudyQuestions(getStudyQuestions(5));
      return {
        ...prev,
        isTopHalf: true,
        outs: 0,
        bases: [false, false, false],
        strikes: 0,
        balls: 0,
        currentBatterIndex: prev.currentBatterIndex, // keep rotation
        studyBreakNumber: breakNum,
        phase: GAME_PHASES.STUDY_BREAK,
        _mercy: mercy,
      };
    });
  }

  function handleStudyBreakComplete(results) {
    const correctCount = results.filter((r) => r.correct).length;
    const coinsFromBreak = correctCount * 10;

    setGame((prev) => {
      const newResults = [...prev.studyBreakResults, { correct: correctCount, total: 5 }];
      const newCoins = prev.coinsEarned + coinsFromBreak;
      const isLastBreak = prev.studyBreakNumber >= 3;
      const mercy = checkMercyRule(prev.playerScore, prev.aiScore);

      if (isLastBreak && correctCount >= 4) {
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.BONUS_ROUND,
        };
      }
      if (prev.inning >= 3 || mercy) {
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.GAME_OVER,
        };
      }
      setStudyQuestions(null);
      return {
        ...prev,
        inning: prev.inning + 1,
        isTopHalf: true,
        outs: 0,
        bases: [false, false, false],
        strikes: 0,
        balls: 0,
        coinsEarned: newCoins,
        studyBreakResults: newResults,
        phase: GAME_PHASES.BATTING,
      };
    });
  }

  function handleBonusComplete(bonusCoins) {
    setGame((prev) => ({
      ...prev,
      coinsEarned: prev.coinsEarned + bonusCoins,
      phase: GAME_PHASES.GAME_OVER,
    }));
  }

  function handleGameOver() {
    onGameEnd({
      playerScore: game.playerScore,
      aiScore: game.aiScore,
      coinsEarned: game.coinsEarned,
      studyBreakResults: game.studyBreakResults,
      won: game.playerScore > game.aiScore,
    });
  }

  // ---- Alt screens ----

  if (game.phase === GAME_PHASES.STUDY_BREAK && studyQuestions) {
    return (
      <StudyBreak
        questions={studyQuestions}
        breakNumber={game.studyBreakNumber}
        onComplete={handleStudyBreakComplete}
      />
    );
  }

  if (game.phase === GAME_PHASES.BONUS_ROUND) {
    return <BonusRound onComplete={handleBonusComplete} />;
  }

  if (game.phase === GAME_PHASES.GAME_OVER) {
    const won = game.playerScore > game.aiScore;
    return (
      <div className="game-over-screen">
        <div className="game-over-card">
          <h1 className={won ? 'win-text' : 'loss-text'}>
            {won ? 'YOU WIN!' : game.playerScore === game.aiScore ? 'TIE GAME!' : 'GAME OVER'}
          </h1>
          <div className="final-score">
            <div className="score-team">
              <span className="score-label">The {profile.teamName}</span>
              <span className="score-number big">{game.playerScore}</span>
            </div>
            <span className="score-vs">vs</span>
            <div className="score-team">
              <span className="score-label">Opponents</span>
              <span className="score-number">{game.aiScore}</span>
            </div>
          </div>
          <div className="coins-earned">
            <span className="coin-icon big">&#x1FA99;</span>
            <span className="coins-text">+{game.coinsEarned} Scholar Coins</span>
          </div>
          <button className="btn btn-primary btn-big" onClick={handleGameOver}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (game.phase === GAME_PHASES.HALF_INNING_OVER) {
    return (
      <div className="inning-break-screen">
        <div className="inning-break-card">
          <h2>End of Half Inning</h2>
          <p className="inning-sub">
            {game.isTopHalf ? 'Your offense is done. Opponent is up next.' : 'Opponent done batting.'}
          </p>
          <div className="final-score">
            <div className="score-team">
              <span className="score-label">You</span>
              <span className="score-number">{game.playerScore}</span>
            </div>
            <span className="score-vs">-</span>
            <div className="score-team">
              <span className="score-label">Opp</span>
              <span className="score-number">{game.aiScore}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-big" onClick={startAiHalfInning}>
            {game.isTopHalf ? 'Take the field \u2192' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  if (game.phase === GAME_PHASES.AI_BATTING && aiHalf) {
    const step = aiHalf.steps[aiHalf.idx];
    const isLast = aiHalf.idx + 1 >= aiHalf.steps.length;
    return (
      <div className="ai-batting-screen">
        <div className="ai-batting-header">
          <span className="ai-batting-label">OPPONENT AT BAT</span>
          <div className="ai-score-pill">
            You {game.playerScore} &nbsp; &ndash; &nbsp; Opp {game.aiScore}
          </div>
          <div className="ai-count">
            Outs: {'\u25CF'.repeat(step?.outs ?? 0)}{'\u25CB'.repeat(3 - (step?.outs ?? 0))}
          </div>
        </div>
        <div className="ai-play-card">
          <p className="ai-play-description">{step?.description}</p>
          <p className="ai-play-hint">(Fielding is auto-simulated for now &mdash; real fielding controls coming in the next pass.)</p>
          <button className="btn btn-primary btn-big" onClick={advanceAiStep}>
            {isLast ? 'End Half Inning' : 'Next Play'}
          </button>
        </div>
      </div>
    );
  }

  // ---- Main batting UI ----

  const pitchReady = game.phase === GAME_PHASES.BATTING;
  const pitchLive = game.phase === GAME_PHASES.PITCH_INCOMING;

  return (
    <div className="game-screen v2">
      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="score-row">
          <span className="team-badge" style={{ backgroundColor: profile.teamColor?.primary || '#e74c3c' }}>
            {profile.teamName?.substring(0, 3).toUpperCase() || 'YOU'}
          </span>
          <span className="score">{game.playerScore}</span>
          <span className="inning-display">
            {game.isTopHalf ? '\u25B2' : '\u25BC'} Inning {game.inning} / 3
          </span>
          <span className="score">{game.aiScore}</span>
          <span className="team-badge opp">OPP</span>
        </div>
        <div className="count-row">
          <span className="count">B: {'\u25CF'.repeat(game.balls)}{'\u25CB'.repeat(4 - game.balls)}</span>
          <span className="count">S: {'\u25CF'.repeat(game.strikes)}{'\u25CB'.repeat(3 - game.strikes)}</span>
          <span className="count">O: {'\u25CF'.repeat(game.outs)}{'\u25CB'.repeat(3 - game.outs)}</span>
        </div>
      </div>

      {/* Phase banner */}
      <div className="phase-banner batting">YOU&rsquo;RE BATTING</div>

      {/* Field scene */}
      <div className="field-wrap">
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="game-field v2"
          onClick={pitchLive ? handleSwing : undefined}
        />
        {swingResult && (
          <div className={`swing-result ${swingResult.type}`}>
            {swingResult.description}
          </div>
        )}
      </div>

      {/* Batter info */}
      <div className="batter-info">
        <span className="batter-name">Now batting: <strong>{currentBatter.name}</strong></span>
        <span className="batter-stat">BAT {currentBatter.batting}</span>
      </div>

      {/* Swing type selector */}
      <div className="swing-types">
        {SWING_TYPES.map((s) => (
          <button
            key={s.id}
            className={`swing-type-btn ${swingType === s.id ? 'active' : ''}`}
            style={swingType === s.id ? { backgroundColor: s.color, color: '#fff' } : undefined}
            onClick={() => setSwingType(s.id)}
            disabled={pitchLive}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="game-controls">
        {pitchReady && (
          <button className="btn btn-pitch" onClick={throwPitch}>
            Pitch!
          </button>
        )}
        {pitchLive && (
          <button className="btn btn-swing" onClick={handleSwing}>
            SWING!
          </button>
        )}
      </div>

      {/* Coins HUD */}
      <div className="game-coins">
        <span className="coin-icon">&#x1FA99;</span> {game.coinsEarned}
      </div>

      {/* Did You Know overlay */}
      {didYouKnow && (
        <DidYouKnowCard fact={didYouKnow} onClose={closeDidYouKnow} />
      )}
    </div>
  );
}

// Bases diamond drawn in top-right corner of canvas
function drawBasesInset(ctx, bases, teamColor) {
  const cx = CW - 70;
  const cy = 60;
  const s = 14;
  const points = [
    [cx, cy + s],       // home
    [cx + s, cy],       // 1st
    [cx, cy - s],       // 2nd
    [cx - s, cy],       // 3rd
  ];
  ctx.save();
  // backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
  // bases
  const baseCoords = [points[1], points[2], points[3]];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = bases[i] ? teamColor : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(baseCoords[i][0], baseCoords[i][1], 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Bonus Round (manual-advance version) ----
function BonusRound({ onComplete }) {
  const [questions] = useState(() => {
    const pool = [...scienceQuestions.questions];
    return pool.sort(() => Math.random() - 0.5);
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const current = questions[currentIdx];

  function handleAnswer(optionIdx) {
    if (showResult) return;
    setSelected(optionIdx);
    setShowResult(true);
    const isCorrect = optionIdx === current.answer;
    if (isCorrect) setCoins((c) => c + 10);
    else setWrongCount((w) => w + 1);
  }

  function handleNext() {
    const isCorrect = selected === current.answer;
    if (!isCorrect && wrongCount >= 3) {
      onComplete(coins);
      return;
    }
    setSelected(null);
    setShowResult(false);
    setCurrentIdx((i) => i + 1);
  }

  if (!current) {
    onComplete(coins);
    return null;
  }

  const isCorrect = selected === current.answer;
  const willEnd = showResult && !isCorrect && wrongCount >= 3;

  return (
    <div className="study-screen">
      <div className="study-card">
        <div className="bonus-header">
          <h2>Bonus Round!</h2>
          <p>Keep going until you get 3 wrong.</p>
          <div className="bonus-status">
            <span className="coin-icon">&#x1FA99;</span> +{coins}
            <span className="wrong-count">
              {'\u274C'.repeat(wrongCount)}{'\u2B1C'.repeat(3 - wrongCount)}
            </span>
          </div>
        </div>
        <p className="study-question">{current.question}</p>
        <div className="study-options">
          {current.options.map((opt, i) => (
            <button
              key={i}
              className={`study-option ${showResult ? (i === current.answer ? 'correct' : i === selected ? 'wrong' : '') : ''}`}
              onClick={() => handleAnswer(i)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {showResult && (
          <>
            <div className={`study-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
              <span className="feedback-icon">{isCorrect ? '\u2714' : '\u2716'}</span>
              <div className="feedback-body">
                <p className="study-explanation">{current.explanation}</p>
                {isCorrect && <span className="coin-earned">+10 &#x1FA99;</span>}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleNext}>
              {willEnd ? 'Finish Bonus Round' : 'Next Question'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
