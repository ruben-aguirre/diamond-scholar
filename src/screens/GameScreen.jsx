import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GAME_PHASES,
  createGameState,
  generatePitch,
  calculateSwingResult,
  advanceRunners,
  simulateAIHalfInning,
  checkMercyRule,
  getTeamAverage,
} from '../game/GameEngine';
import StudyBreak from './StudyBreak';
import scienceQuestions from '../data/questions/science-4th.json';

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

export default function GameScreen({ profile, onGameEnd }) {
  const [game, setGame] = useState(() => createGameState(profile));
  const [pitchAnim, setPitchAnim] = useState(null);
  const [swingResult, setSwingResult] = useState(null);
  const [didYouKnow, setDidYouKnow] = useState(null);
  const [studyQuestions, setStudyQuestions] = useState(null);
  const [bonusRound, setBonusRound] = useState(false);
  const pitchStartTime = useRef(null);
  const canvasRef = useRef(null);

  const currentBatter = game.lineup[game.currentBatterIndex % game.lineup.length];
  const teamAvg = getTeamAverage(profile.roster);

  // Draw the field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, w, h);

    // Grass
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    // Dirt diamond
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.35); // home plate area top
    ctx.lineTo(w * 0.75, h * 0.55);
    ctx.lineTo(w / 2, h * 0.75);
    ctx.lineTo(w * 0.25, h * 0.55);
    ctx.closePath();
    ctx.fill();

    // Infield grass
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.42);
    ctx.lineTo(w * 0.68, h * 0.55);
    ctx.lineTo(w / 2, h * 0.68);
    ctx.lineTo(w * 0.32, h * 0.55);
    ctx.closePath();
    ctx.fill();

    // Bases
    const baseSize = 8;
    ctx.fillStyle = 'white';

    // 1st base
    ctx.fillRect(w * 0.68 - baseSize / 2, h * 0.55 - baseSize / 2, baseSize, baseSize);
    // 2nd base
    ctx.fillRect(w / 2 - baseSize / 2, h * 0.42 - baseSize / 2, baseSize, baseSize);
    // 3rd base
    ctx.fillRect(w * 0.32 - baseSize / 2, h * 0.55 - baseSize / 2, baseSize, baseSize);
    // Home plate
    ctx.fillRect(w / 2 - baseSize / 2, h * 0.75 - baseSize / 2, baseSize, baseSize);

    // Runners on base
    const basePositions = [
      [w * 0.68, h * 0.55],
      [w / 2, h * 0.42],
      [w * 0.32, h * 0.55],
    ];
    game.bases.forEach((occupied, i) => {
      if (occupied) {
        ctx.fillStyle = profile.teamColor.primary;
        ctx.beginPath();
        ctx.arc(basePositions[i][0], basePositions[i][1] - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Pitcher mound
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.55, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pitch animation
    if (pitchAnim) {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pitchAnim.x, pitchAnim.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [game.bases, pitchAnim, profile.teamColor.primary]);

  const throwPitch = useCallback(() => {
    const pitch = generatePitch(teamAvg);
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // Animate pitch from mound to plate
    const startX = w / 2;
    const startY = h * 0.55;
    const endX = w / 2 + pitch.x * 40;
    const endY = h * 0.75 + pitch.y * 20;

    let progress = 0;
    pitchStartTime.current = Date.now();

    setGame((g) => ({ ...g, phase: GAME_PHASES.PITCH_INCOMING, pitchType: pitch.type }));

    const animate = () => {
      progress += 0.03 + pitch.speed * 0.02;
      if (progress >= 1) {
        setPitchAnim({ x: endX, y: endY });
        // Auto-take if not swung
        setTimeout(() => {
          if (pitchStartTime.current) {
            // Player didn't swing - check if ball or strike
            pitchStartTime.current = null;
            setPitchAnim(null);
            if (pitch.isStrike) {
              handleStrike();
            } else {
              handleBall();
            }
          }
        }, 800);
        return;
      }
      const cx = startX + (endX - startX) * progress;
      const cy = startY + (endY - startY) * progress;
      setPitchAnim({ x: cx, y: cy });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Store pitch for swing calculation
    setGame((g) => ({ ...g, pitchLocation: pitch }));
  }, [teamAvg]);

  function handleSwing() {
    if (game.phase !== GAME_PHASES.PITCH_INCOMING || !pitchStartTime.current) return;

    const elapsed = Date.now() - pitchStartTime.current;
    pitchStartTime.current = null;
    setPitchAnim(null);

    // Timing: ideal is ~500-700ms after pitch starts. Map to 0-1 scale.
    const idealTime = 600;
    const timing = Math.min(1, Math.abs(elapsed - idealTime) / idealTime);

    const result = calculateSwingResult(timing, game.pitchLocation, currentBatter);
    setSwingResult(result);

    if (result.type === 'miss') {
      handleStrike();
      return;
    }
    if (result.type === 'foul') {
      setGame((g) => ({
        ...g,
        strikes: Math.min(g.strikes + 1, 2), // fouls can't strike out
        phase: GAME_PHASES.SWING_RESULT,
      }));
      setTimeout(() => {
        setSwingResult(null);
        setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
      }, 1500);
      return;
    }

    if (result.isOut) {
      setGame((g) => {
        const newOuts = g.outs + 1;
        return {
          ...g,
          outs: newOuts,
          phase: GAME_PHASES.SWING_RESULT,
        };
      });
      setTimeout(() => {
        setSwingResult(null);
        handleAfterPlay(true);
      }, 1500);
      return;
    }

    // Hit! Advance runners
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
    setTimeout(() => {
      setSwingResult(null);
      handleAfterPlay(false);
    }, 2000);
  }

  function handleStrike() {
    setGame((g) => {
      const newStrikes = g.strikes + 1;
      if (newStrikes >= 3) {
        return { ...g, strikes: 0, balls: 0, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT };
      }
      return { ...g, strikes: newStrikes, phase: GAME_PHASES.BATTING };
    });
    setSwingResult({ type: 'strike', description: 'Strike!' });
    setTimeout(() => {
      setSwingResult(null);
      setGame((prev) => {
        if (prev.strikes === 0 && prev.phase === GAME_PHASES.SWING_RESULT) {
          // Strikeout happened
          handleAfterPlay(true);
        }
        return prev;
      });
    }, 1000);
  }

  function handleBall() {
    setGame((g) => {
      const newBalls = g.balls + 1;
      if (newBalls >= 4) {
        // Walk
        const { newBases, runs } = advanceRunners(g.bases, 1);
        setSwingResult({ type: 'walk', description: 'Ball four! Take your base.' });
        setTimeout(() => {
          setSwingResult(null);
          handleAfterPlay(false);
        }, 1500);
        return { ...g, balls: 0, strikes: 0, bases: newBases, playerScore: g.playerScore + runs, phase: GAME_PHASES.SWING_RESULT };
      }
      setSwingResult({ type: 'ball', description: 'Ball!' });
      setTimeout(() => setSwingResult(null), 800);
      return { ...g, balls: newBalls, phase: GAME_PHASES.BATTING };
    });
  }

  function handleAfterPlay(wasOut) {
    setGame((prev) => {
      // Check if half-inning is over
      if (prev.outs >= 3 || (wasOut && prev.outs + (prev.phase === GAME_PHASES.SWING_RESULT ? 0 : 1) >= 3)) {
        return { ...prev, phase: GAME_PHASES.HALF_INNING_OVER };
      }

      // Next batter with Did You Know
      const fact = getRandomFact();
      setDidYouKnow(fact);
      setTimeout(() => {
        setDidYouKnow(null);
        setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
      }, 5000);

      return {
        ...prev,
        currentBatterIndex: prev.currentBatterIndex + 1,
        strikes: 0,
        balls: 0,
        phase: GAME_PHASES.DID_YOU_KNOW,
      };
    });
  }

  function handleHalfInningEnd() {
    setGame((prev) => {
      if (prev.isTopHalf) {
        // AI's turn to bat
        const aiResult = simulateAIHalfInning(teamAvg);
        const newAiScore = prev.aiScore + aiResult.runs;

        // Check mercy rule after full inning
        const isMercy = prev.inning > 1 && checkMercyRule(prev.playerScore, newAiScore);

        if (isMercy || prev.inning >= 3) {
          // Study break before game end check
          const breakNum = prev.studyBreakNumber + 1;
          setStudyQuestions(getStudyQuestions(5));
          return {
            ...prev,
            aiScore: newAiScore,
            isTopHalf: true,
            outs: 0,
            bases: [false, false, false],
            strikes: 0,
            balls: 0,
            currentBatterIndex: 0,
            studyBreakNumber: breakNum,
            phase: GAME_PHASES.STUDY_BREAK,
            lastPlayDescription: aiResult.description,
          };
        }

        // Study break between innings
        const breakNum = prev.studyBreakNumber + 1;
        setStudyQuestions(getStudyQuestions(5));
        return {
          ...prev,
          aiScore: newAiScore,
          studyBreakNumber: breakNum,
          phase: GAME_PHASES.STUDY_BREAK,
          lastPlayDescription: aiResult.description,
        };
      }
      return prev;
    });
  }

  function handleStudyBreakComplete(results) {
    const correct = results.filter((r) => r.correct).length;
    const coinsFromBreak = correct * 10;

    setGame((prev) => {
      const newResults = [...prev.studyBreakResults, { correct, total: 5 }];
      const newCoins = prev.coinsEarned + coinsFromBreak;

      // Check if this is the last study break and qualifies for bonus
      const isLastBreak = prev.studyBreakNumber >= 3;
      if (isLastBreak && correct >= 4) {
        setBonusRound(true);
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.BONUS_ROUND,
        };
      }

      // Check if game should end
      if (prev.inning >= 3 || checkMercyRule(prev.playerScore, prev.aiScore)) {
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.GAME_OVER,
        };
      }

      // Next inning
      setStudyQuestions(null);
      return {
        ...prev,
        inning: prev.inning + 1,
        isTopHalf: true,
        outs: 0,
        bases: [false, false, false],
        strikes: 0,
        balls: 0,
        currentBatterIndex: 0,
        coinsEarned: newCoins,
        studyBreakResults: newResults,
        phase: GAME_PHASES.BATTING,
      };
    });
  }

  function handleBonusComplete(bonusCoins) {
    setBonusRound(false);
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

  // Study break screen
  if (game.phase === GAME_PHASES.STUDY_BREAK && studyQuestions) {
    return (
      <StudyBreak
        questions={studyQuestions}
        breakNumber={game.studyBreakNumber}
        onComplete={handleStudyBreakComplete}
      />
    );
  }

  // Bonus round
  if (game.phase === GAME_PHASES.BONUS_ROUND) {
    return (
      <BonusRound onComplete={handleBonusComplete} />
    );
  }

  // Game over screen
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

  // Half inning over
  if (game.phase === GAME_PHASES.HALF_INNING_OVER) {
    return (
      <div className="game-over-screen">
        <div className="game-over-card">
          <h2>End of Half Inning</h2>
          <div className="final-score">
            <div className="score-team">
              <span className="score-label">You</span>
              <span className="score-number">{game.playerScore}</span>
            </div>
            <span className="score-vs">-</span>
            <div className="score-team">
              <span className="score-label">AI</span>
              <span className="score-number">{game.aiScore}</span>
            </div>
          </div>
          {game.lastPlayDescription && <p>{game.lastPlayDescription}</p>}
          <button className="btn btn-primary" onClick={handleHalfInningEnd}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="score-row">
          <span className="team-badge" style={{ backgroundColor: profile.teamColor.primary }}>
            {profile.teamName.substring(0, 3).toUpperCase()}
          </span>
          <span className="score">{game.playerScore}</span>
          <span className="inning-display">Inning {game.inning} / 3</span>
          <span className="score">{game.aiScore}</span>
          <span className="team-badge opp">OPP</span>
        </div>
        <div className="count-row">
          <span className="count">
            B: {'●'.repeat(game.balls)}{'○'.repeat(4 - game.balls)}
          </span>
          <span className="count">
            S: {'●'.repeat(game.strikes)}{'○'.repeat(3 - game.strikes)}
          </span>
          <span className="count">
            O: {'●'.repeat(game.outs)}{'○'.repeat(3 - game.outs)}
          </span>
        </div>
      </div>

      {/* Field */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="game-field"
        onClick={handleSwing}
      />

      {/* Batter info */}
      <div className="batter-info">
        <span className="batter-name">{currentBatter?.name || 'Unknown'}</span>
        <span className="batter-stat">BAT: {currentBatter?.batting || 0}</span>
      </div>

      {/* Swing result overlay */}
      {swingResult && (
        <div className={`swing-result ${swingResult.type}`}>
          {swingResult.description}
        </div>
      )}

      {/* Did You Know overlay */}
      {didYouKnow && (
        <div className="dyk-card">
          <span className="dyk-label">Did You Know?</span>
          <p className="dyk-fact">{didYouKnow.fact}</p>
        </div>
      )}

      {/* Controls */}
      <div className="game-controls">
        {game.phase === GAME_PHASES.BATTING && (
          <button className="btn btn-pitch" onClick={throwPitch}>
            Ready for Pitch
          </button>
        )}
        {game.phase === GAME_PHASES.PITCH_INCOMING && (
          <button className="btn btn-swing" onClick={handleSwing}>
            SWING!
          </button>
        )}
      </div>

      {/* Coins */}
      <div className="game-coins">
        <span className="coin-icon">&#x1FA99;</span> {game.coinsEarned}
      </div>
    </div>
  );
}

function BonusRound({ onComplete }) {
  const [questions] = useState(() => {
    // Get a big pool of questions for the bonus round
    const pool = [...scienceQuestions.questions];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled;
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
    if (isCorrect) {
      setCoins((c) => c + 10);
    } else {
      setWrongCount((w) => w + 1);
    }

    setTimeout(() => {
      if (!isCorrect && wrongCount + 1 >= 3) {
        onComplete(coins + (isCorrect ? 10 : 0));
        return;
      }
      setSelected(null);
      setShowResult(false);
      setCurrentIdx((i) => i + 1);
    }, 1500);
  }

  if (!current) {
    onComplete(coins);
    return null;
  }

  return (
    <div className="study-screen">
      <div className="study-card">
        <div className="bonus-header">
          <h2>Bonus Round!</h2>
          <p>Keep going until you get 3 wrong!</p>
          <div className="bonus-status">
            <span className="coin-icon">&#x1FA99;</span> +{coins}
            <span className="wrong-count">{'❌'.repeat(wrongCount)}{'⬜'.repeat(3 - wrongCount)}</span>
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
          <p className="study-explanation">{current.explanation}</p>
        )}
      </div>
    </div>
  );
}
