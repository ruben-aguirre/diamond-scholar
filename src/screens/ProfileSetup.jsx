import { useState } from 'react';
import { starterRoster } from '../data/players';

const AVAILABLE_SUBJECTS = [
  { key: 'science', label: 'Science', icon: '🔬' },
];

const GRADE_OPTIONS = [3, 4, 5];

const TEAM_COLORS = [
  { name: 'Red', primary: '#e74c3c', secondary: '#c0392b' },
  { name: 'Blue', primary: '#3498db', secondary: '#2980b9' },
  { name: 'Green', primary: '#27ae60', secondary: '#219a52' },
  { name: 'Orange', primary: '#f39c12', secondary: '#d68910' },
  { name: 'Purple', primary: '#9b59b6', secondary: '#8e44ad' },
  { name: 'Black', primary: '#2c3e50', secondary: '#1a252f' },
];

export default function ProfileSetup({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [grades, setGrades] = useState({ science: 4 });

  function handleNameSubmit(e) {
    e.preventDefault();
    if (name.trim()) setStep(1);
  }

  function handleTeamSubmit(e) {
    e.preventDefault();
    if (teamName.trim()) setStep(2);
  }

  function handleGradeSelect(subject, grade) {
    setGrades((prev) => ({ ...prev, [subject]: grade }));
  }

  function handleFinish() {
    const profile = {
      id: 'profile-' + Date.now(),
      name: name.trim(),
      teamName: teamName.trim(),
      teamColor,
      gradeSelections: grades,
      roster: starterRoster.map((p) => ({ ...p })),
      lineup: starterRoster.map((p) => p.id),
      coins: 0,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalCoinsEarned: 0,
        questionsCorrect: 0,
        questionsTotal: 0,
      },
      createdAt: new Date().toISOString(),
    };
    onComplete(profile);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        {step === 0 && (
          <>
            <h1 className="setup-title">Welcome to Diamond Scholar!</h1>
            <p className="setup-subtitle">What's your name, slugger?</p>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                className="setup-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={20}
              />
              <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                Next
              </button>
            </form>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="setup-title">Hey {name}!</h1>
            <p className="setup-subtitle">Name your team</p>
            <form onSubmit={handleTeamSubmit}>
              <input
                type="text"
                className="setup-input"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                autoFocus
                maxLength={24}
              />
              <div className="color-picker">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-swatch ${teamColor.name === c.name ? 'selected' : ''}`}
                    style={{ backgroundColor: c.primary }}
                    onClick={() => setTeamColor(c)}
                    title={c.name}
                  />
                ))}
              </div>
              <button type="submit" className="btn btn-primary" disabled={!teamName.trim()}>
                Next
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="setup-title">Pick Your Grade Level</h1>
            <p className="setup-subtitle">
              Since you're homeschooled, pick the grade for each subject separately.
            </p>
            {AVAILABLE_SUBJECTS.map((subject) => (
              <div key={subject.key} className="grade-row">
                <span className="grade-label">
                  {subject.icon} {subject.label}
                </span>
                <div className="grade-buttons">
                  {GRADE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      className={`btn btn-grade ${grades[subject.key] === g ? 'active' : ''}`}
                      onClick={() => handleGradeSelect(subject.key, g)}
                    >
                      {g}th
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="setup-summary">
              <div className="summary-item">
                <span className="summary-icon">&#9918;</span>
                <span>{name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon" style={{ color: teamColor.primary }}>&#9632;</span>
                <span>The {teamName}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-big" onClick={handleFinish}>
              Let's Play Ball!
            </button>
          </>
        )}

        {step > 0 && (
          <button className="btn btn-back" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
