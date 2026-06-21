import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProfileSetup from './screens/ProfileSetup';
import ProfileSelect from './screens/ProfileSelect';
import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import GameScreen from './screens/GameScreen';
import './App.css';

function App() {
  const [profiles, setProfiles] = useLocalStorage('diamond-scholar-profiles', []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage('diamond-scholar-active', null);
  const [screen, setScreen] = useState('auto'); // auto, setup, select, home, team, game

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  // Auto-detect what screen to show
  const currentScreen = (() => {
    if (screen === 'setup') return 'setup';
    if (screen !== 'auto') return screen;
    if (profiles.length === 0) return 'setup';
    if (!activeProfile) return 'select';
    return 'home';
  })();

  function handleProfileCreated(profile) {
    setProfiles((prev) => [...prev, profile]);
    setActiveProfileId(profile.id);
    setScreen('home');
  }

  function handleSelectProfile(id) {
    setActiveProfileId(id);
    setScreen('home');
  }

  function handleSwitchProfile() {
    setActiveProfileId(null);
    setScreen('select');
  }

  function handleCreateNew() {
    setScreen('setup');
  }

  function handleNavigate(dest) {
    setScreen(dest);
  }

  function updateProfile(updates) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfileId ? { ...p, ...updates } : p))
    );
  }

  // Fold a game's hits/at-bats into each player's career totals so their
  // baseball-card batting average reflects every game they've batted in.
  function applyBattingStats(roster, battingStats) {
    const gameStats = battingStats || {};
    return roster.map((player) => {
      const g = gameStats[player.id];
      if (!g) return player;
      return {
        ...player,
        careerAB: (player.careerAB || 0) + g.ab,
        careerHits: (player.careerHits || 0) + g.hits,
      };
    });
  }

  // Save-and-exit: keep the batting stats earned so far, but don't count this
  // as a finished game (no win/loss, no games-played bump). Then show My Team.
  function handleSaveAndExit(battingStats) {
    updateProfile({ roster: applyBattingStats(activeProfile.roster, battingStats) });
    setScreen('team');
  }

  function handleGameEnd(results) {
    const updatedRoster = applyBattingStats(activeProfile.roster, results.battingStats);

    updateProfile({
      coins: activeProfile.coins + results.coinsEarned,
      roster: updatedRoster,
      stats: {
        ...activeProfile.stats,
        gamesPlayed: activeProfile.stats.gamesPlayed + 1,
        gamesWon: activeProfile.stats.gamesWon + (results.won ? 1 : 0),
        totalCoinsEarned: activeProfile.stats.totalCoinsEarned + results.coinsEarned,
        questionsCorrect:
          activeProfile.stats.questionsCorrect +
          results.studyBreakResults.reduce((sum, r) => sum + r.correct, 0),
        questionsTotal:
          activeProfile.stats.questionsTotal +
          results.studyBreakResults.reduce((sum, r) => sum + r.total, 0),
      },
    });
    setScreen('home');
  }

  // Re-read active profile after updates
  const freshProfile = profiles.find((p) => p.id === activeProfileId) || activeProfile;

  switch (currentScreen) {
    case 'setup':
      return <ProfileSetup onComplete={handleProfileCreated} />;
    case 'select':
      return (
        <ProfileSelect
          profiles={profiles}
          onSelect={handleSelectProfile}
          onCreateNew={handleCreateNew}
        />
      );
    case 'home':
      return (
        <HomeScreen
          profile={freshProfile}
          onNavigate={handleNavigate}
          onSwitchProfile={handleSwitchProfile}
        />
      );
    case 'team':
      return <TeamScreen profile={freshProfile} onUpdateProfile={updateProfile} onBack={() => setScreen('home')} />;
    case 'game':
      return (
        <GameScreen
          profile={freshProfile}
          onGameEnd={handleGameEnd}
          onSaveAndExit={handleSaveAndExit}
        />
      );
    default:
      return <HomeScreen profile={freshProfile} onNavigate={handleNavigate} onSwitchProfile={handleSwitchProfile} />;
  }
}

export default App;
