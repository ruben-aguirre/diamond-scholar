import { useState } from 'react';

export default function StudyBreak({ questions, breakNumber, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const current = questions[currentIdx];
  const correct = results.filter((r) => r.correct).length;

  function handleAnswer(optionIdx) {
    if (showResult) return;
    setSelected(optionIdx);
    setShowResult(true);

    const isCorrect = optionIdx === current.answer;
    const newResults = [...results, { questionId: current.id, correct: isCorrect }];
    setResults(newResults);

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        onComplete(newResults);
        return;
      }
      setSelected(null);
      setShowResult(false);
      setCurrentIdx((i) => i + 1);
    }, 2000);
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
          <div className={`study-feedback ${selected === current.answer ? 'correct' : 'wrong'}`}>
            {selected === current.answer ? (
              <span className="feedback-icon">&#10004;</span>
            ) : (
              <span className="feedback-icon">&#x2716;</span>
            )}
            <p className="study-explanation">{current.explanation}</p>
            {selected === current.answer && (
              <span className="coin-earned">+10 &#x1FA99;</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
