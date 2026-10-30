import { useRef, useState } from 'react';
import { getStudyTokenProgress } from '../game/studyTokens';
import StudyTokenStatus from './StudyTokenStatus';

export default function StudyBreak({ questions, breakNumber, onComplete, startingStreak = 0, tokenBalance = 0, onTokenEarned }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const answeredRef = useRef(false);
  const completedRef = useRef(false);
  const tokenProgress = getStudyTokenProgress(startingStreak, results);

  const current = questions[currentIdx];
  const correct = results.filter((r) => r.correct).length;
  const isLast = currentIdx + 1 >= questions.length;

  function handleAnswer(optionIdx) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setSelected(optionIdx);
    setShowResult(true);

    const isCorrect = optionIdx === current.answer;
    const nextResults = [...results, { questionId: current.id, correct: isCorrect }];
    const nextProgress = getStudyTokenProgress(startingStreak, nextResults);
    setResults(nextResults);
    if (nextProgress.tokensEarned > tokenProgress.tokensEarned) onTokenEarned?.(1);
  }

  function handleNext() {
    if (!answeredRef.current || completedRef.current) return;
    if (isLast) {
      // The last answer is already in `results` — you must answer (which calls
      // setResults) before the "See Results" button appears, and that state has
      // flushed by the time this click fires.
      completedRef.current = true;
      onComplete(results);
      return;
    }
    setSelected(null);
    answeredRef.current = false;
    setShowResult(false);
    setCurrentIdx((i) => i + 1);
  }

  return (
    <div className="study-screen">
      <div className="study-card">
        <div className="study-header">
          <h2>Study Break {breakNumber}</h2>
          <div className="study-progress">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span className="coin-icon">&#x1FA99;</span> +{correct * 10}
          </div>
          <StudyTokenStatus progress={tokenProgress} balance={tokenBalance} />
          <div className="progress-dots">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`dot ${i < results.length ? (results[i].correct ? 'correct' : 'wrong') : i === currentIdx ? 'current' : ''}`}
              />
            ))}
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
            <div className={`study-feedback ${selected === current.answer ? 'correct' : 'wrong'}`}>
              {selected === current.answer ? (
                <span className="feedback-icon">&#10004;</span>
              ) : (
                <span className="feedback-icon">&#x2716;</span>
              )}
              <div className="feedback-body">
                <p className="study-explanation">{current.explanation}</p>
                {selected === current.answer && (
                  <span className="coin-earned">+10 &#x1FA99;</span>
                )}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleNext}>
              {isLast ? 'See Results' : 'Next Question'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
