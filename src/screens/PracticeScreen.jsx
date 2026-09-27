import { useEffect, useRef, useState } from 'react';
import scienceQuestions from '../data/questions/science-4th.json';

const PRACTICE = {
  batting: {
    title: 'Batting Practice',
    icon: '⚾',
    stat: 'batting',
    intro: 'Time your swing when the marker reaches the green zone.',
  },
  fielding: {
    title: 'Fielding Practice',
    icon: '🥎',
    stat: 'fielding',
    intro: 'Read the play and throw to the best base.',
  },
  running: {
    title: 'Running Practice',
    icon: '🏃',
    stat: 'speed',
    intro: 'Choose the smart move on the bases.',
  },
};

const FIELDING_REPS = [
  { prompt: 'Ground ball to shortstop. Nobody is on base.', choices: ['First', 'Second', 'Home'], answer: 'First' },
  { prompt: 'Ground ball to second. A runner is going from first to second.', choices: ['First', 'Second', 'Third'], answer: 'Second' },
  { prompt: 'Fly ball with a runner on third. The runner tags up for home.', choices: ['First', 'Third', 'Home'], answer: 'Home' },
  { prompt: 'Bunt in front of the plate. The batter is sprinting.', choices: ['First', 'Second', 'Home'], answer: 'First' },
  { prompt: 'Ground ball to third. A runner is heading from second to third.', choices: ['First', 'Third', 'Home'], answer: 'Third' },
  { prompt: 'Single to right field. A runner is trying to score from second.', choices: ['Second', 'Third', 'Home'], answer: 'Home' },
];

const RUNNING_REPS = [
  { prompt: 'A fly ball is still in the air. You are on first.', choices: ['Run', 'Hold'], answer: 'Hold' },
  { prompt: 'The ball gets past the outfielder and rolls to the wall.', choices: ['Run', 'Hold'], answer: 'Run' },
  { prompt: 'A line drive is caught. You left the base early.', choices: ['Run', 'Go Back'], answer: 'Go Back' },
  { prompt: 'There are two outs and the batter hits the ball.', choices: ['Run', 'Hold'], answer: 'Run' },
  { prompt: 'The catcher drops the ball and home plate is open.', choices: ['Run Home', 'Hold'], answer: 'Run Home' },
  { prompt: 'The third-base coach has both hands up at third.', choices: ['Run Home', 'Hold'], answer: 'Hold' },
];

function shuffledQuestion() {
  const questions = scienceQuestions.questions;
  return questions[Math.floor(Math.random() * questions.length)];
}

export default function PracticeScreen({ mode, profile, onUpdateProfile, onBack }) {
  const config = PRACTICE[mode];
  const [step, setStep] = useState('player');
  const [playerId, setPlayerId] = useState(profile.lineup?.[0] || profile.roster[0]?.id);
  const [question] = useState(shuffledQuestion);
  const [questionPick, setQuestionPick] = useState(null);
  const [questionCoins, setQuestionCoins] = useState(0);
  const [rep, setRep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [needlePosition, setNeedlePosition] = useState(0);
  const needleDirection = useRef(1);

  const player = profile.roster.find((p) => p.id === playerId) || profile.roster[0];
  const choiceReps = mode === 'fielding' ? FIELDING_REPS : RUNNING_REPS;
  const totalReps = 6;

  useEffect(() => {
    if (step !== 'practice' || mode !== 'batting' || feedback) return undefined;
    const timer = setInterval(() => {
      setNeedlePosition((position) => {
        let next = position + needleDirection.current * 4;
        if (next >= 100) { next = 100; needleDirection.current = -1; }
        if (next <= 0) { next = 0; needleDirection.current = 1; }
        return next;
      });
    }, 45);
    return () => clearInterval(timer);
  }, [step, mode, feedback, rep]);

  function answerQuestion(index) {
    if (questionPick !== null) return;
    setQuestionPick(index);
    if (index === question.answer) setQuestionCoins(10);
  }

  function startPractice() {
    setStep('practice');
    setNeedlePosition(0);
  }

  function nextRep(wasRight) {
    const nextScore = score + (wasRight ? 1 : 0);
    setScore(nextScore);
    setFeedback(wasRight ? 'Nice play!' : 'Good try — learn it and go again.');
    setTimeout(() => {
      if (rep + 1 >= totalReps) {
        finishPractice(nextScore);
      } else {
        setRep((value) => value + 1);
        setFeedback(null);
        setNeedlePosition(0);
        needleDirection.current = 1;
      }
    }, 750);
  }

  function swing() {
    if (feedback) return;
    nextRep(needlePosition >= 35 && needlePosition <= 65);
  }

  function chooseAnswer(choice) {
    if (feedback) return;
    nextRep(choice === choiceReps[rep].answer);
  }

  function finishPractice(finalScore) {
    const gain = Math.round((0.1 + (finalScore / totalReps) * 0.2) * 10) / 10;
    const updatedRoster = profile.roster.map((rosterPlayer) =>
      rosterPlayer.id === player.id
        ? {
            ...rosterPlayer,
            [config.stat]: Math.min(10, Math.round((rosterPlayer[config.stat] + gain) * 10) / 10),
          }
        : rosterPlayer
    );
    onUpdateProfile({
      roster: updatedRoster,
      coins: profile.coins + questionCoins,
      stats: {
        ...profile.stats,
        totalCoinsEarned: profile.stats.totalCoinsEarned + questionCoins,
        questionsCorrect: profile.stats.questionsCorrect + (questionPick === question.answer ? 1 : 0),
        questionsTotal: profile.stats.questionsTotal + 1,
      },
    });
    setStep('done');
  }

  return (
    <div className="practice-screen">
      <header className="screen-header" style={{ backgroundColor: profile.teamColor.primary }}>
        <button className="btn btn-back-arrow" onClick={onBack}>&larr;</button>
        <h1>{config.title}</h1>
        <span className="practice-header-icon">{config.icon}</span>
      </header>

      <main className="practice-content">
        {step === 'player' && (
          <section className="practice-card">
            <h2>Who is practicing?</h2>
            <p className="section-help">Choose one player to improve.</p>
            <div className="practice-player-grid">
              {profile.roster.map((rosterPlayer) => (
                <button
                  key={rosterPlayer.id}
                  className={`practice-player ${playerId === rosterPlayer.id ? 'selected' : ''}`}
                  onClick={() => setPlayerId(rosterPlayer.id)}
                >
                  <strong>{rosterPlayer.name}</strong>
                  <span>{config.stat.toUpperCase()} {rosterPlayer[config.stat]}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setStep('question')}>
              Warm Up
            </button>
          </section>
        )}

        {step === 'question' && (
          <section className="practice-card">
            <span className="practice-kicker">Entry question &middot; Win 10 coins</span>
            <h2>{question.question}</h2>
            <div className="practice-answers">
              {question.options.map((option, index) => {
                const answered = questionPick !== null;
                const className = answered
                  ? index === question.answer
                    ? 'correct'
                    : index === questionPick
                      ? 'wrong'
                      : ''
                  : '';
                return (
                  <button key={option} className={className} onClick={() => answerQuestion(index)} disabled={answered}>
                    {option}
                  </button>
                );
              })}
            </div>
            {questionPick !== null && (
              <>
                <p className={`practice-feedback ${questionPick === question.answer ? 'correct' : 'wrong'}`}>
                  {questionPick === question.answer ? '✓ Correct! +10 coins' : 'Not quite.'} {question.explanation}
                </p>
                <button className="btn btn-primary" onClick={startPractice}>Start Practice</button>
              </>
            )}
          </section>
        )}

        {step === 'practice' && (
          <section className="practice-card practice-play-card">
            <div className="practice-scoreline">
              <span>{player.name}</span>
              <span>Rep {rep + 1} of {totalReps}</span>
              <span>{score} right</span>
            </div>
            <h2>{config.intro}</h2>

            {mode === 'batting' ? (
              <div className="batting-drill">
                <div className="timing-track">
                  <div className="timing-sweet-spot" />
                  <div className="timing-needle" style={{ left: `calc(${needlePosition}% - 4px)` }} />
                </div>
                <button className="practice-action-button" onClick={swing} disabled={Boolean(feedback)}>
                  SWING!
                </button>
              </div>
            ) : (
              <div className="decision-drill">
                <p className="decision-prompt">{choiceReps[rep].prompt}</p>
                <div className="decision-buttons">
                  {choiceReps[rep].choices.map((choice) => (
                    <button key={choice} onClick={() => chooseAnswer(choice)} disabled={Boolean(feedback)}>
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {feedback && <p className="practice-live-feedback">{feedback}</p>}
          </section>
        )}

        {step === 'done' && (
          <section className="practice-card practice-finish">
            <span className="practice-finish-icon">🏆</span>
            <h2>Practice complete!</h2>
            <p>{player.name} got {score} of {totalReps} right.</p>
            <p className="practice-improvement">
              {config.stat.toUpperCase()} improved to {
                profile.roster.find((p) => p.id === player.id)?.[config.stat]
              }
            </p>
            {questionCoins > 0 && <p>Plus {questionCoins} Scholar Coins!</p>}
            <button className="btn btn-primary" onClick={onBack}>Back Home</button>
          </section>
        )}
      </main>
    </div>
  );
}
