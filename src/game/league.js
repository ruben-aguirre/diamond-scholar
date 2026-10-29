import { TEAM_CHOICES } from '../data/teams.js';

export const PLAYER_TEAM_ID = 'player';
export const SEASON_GAMES = 20;

const emptyRecord = { wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 };

// Older profiles start a fresh league without changing their career stats.
export function getLeague(profile) {
  if (profile.league?.version === 2) return profile.league;
  if (profile.league?.version === 1) return repairExtraRounds(profile.league);
  const playerName = profile.teamName.trim().toLowerCase();
  const teams = TEAM_CHOICES.filter((team) => team.name.toLowerCase() !== playerName)
    .slice(0, 14).map((team) => ({ ...team, ...emptyRecord }));
  return {
    version: 2,
    round: 0,
    teams: [{ id: PLAYER_TEAM_ID, ...emptyRecord }, ...teams],
  };
}

export function getLeagueSeason(profile) {
  const league = getLeague(profile);
  const team = league.teams[0];
  const gamesPlayed = team.wins + team.losses + team.ties;
  return {
    number: league.seasonNumber || 1,
    gamesPlayed,
    totalGames: SEASON_GAMES,
    gamesRemaining: Math.max(0, SEASON_GAMES - gamesPlayed),
    complete: gamesPlayed >= SEASON_GAMES,
  };
}

export function startNextLeagueSeason(profile) {
  const league = getLeague(profile);
  const season = getLeagueSeason(profile);
  if (!season.complete) return league;
  return {
    ...league,
    round: 0,
    seasonNumber: season.number + 1,
    scheduleStartDate: null,
    previousSeason: { number: season.number, standings: getStandings(profile) },
    teams: league.teams.map((team) => ({ ...team, ...emptyRecord })),
  };
}

// Circle schedule: every club plays every other club once in 15 rounds.
// With an odd number of teams, one club rests each round.
export function getRoundFixtures(league, round = league.round) {
  const rotating = [...league.teams.slice(1).map((team) => team.id), null];
  const turn = round % rotating.length;
  const order = [PLAYER_TEAM_ID, ...rotating.slice(turn), ...rotating.slice(0, turn)];
  return Array.from({ length: order.length / 2 }, (_, i) => [order[i], order[order.length - 1 - i]])
    .filter(([a, b]) => a !== null && b !== null);
}

export function getNextLeagueGame(profile) {
  const league = getLeague(profile);
  const season = getLeagueSeason(profile);
  if (season.complete) return null;
  let round = league.round;
  let fixture = getRoundFixtures(league, round).find((pair) => pair.includes(PLAYER_TEAM_ID));
  while (!fixture) {
    round += 1;
    fixture = getRoundFixtures(league, round).find((pair) => pair.includes(PLAYER_TEAM_ID));
  }
  return {
    round,
    day: league.teams[0].wins + league.teams[0].losses + league.teams[0].ties + 1,
    seasonNumber: season.number,
    totalGames: season.totalGames,
    opponent: league.teams.find((team) => team.id === fixture.find((id) => id !== PLAYER_TEAM_ID)),
  };
}

// A repeatable roll keeps React's state-update retries from changing results.
function simulatedScore(round, id) {
  let seed = round + 1;
  for (const letter of id) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619);
  seed = Math.imul(seed ^ (seed >>> 16), 2246822507);
  return (seed >>> 0) % 10;
}

function simulatedScores(round, a, b) {
  const scoreA = simulatedScore(round, a);
  const scoreB = simulatedScore(round, b);
  return [scoreA, scoreB === scoreA ? scoreB + 1 : scoreB];
}

function updateRecord(team, scored, allowed, direction = 1) {
  team.wins += scored > allowed ? direction : 0;
  team.losses += scored < allowed ? direction : 0;
  team.ties += scored === allowed ? direction : 0;
  team.runsFor += scored * direction;
  team.runsAgainst += allowed * direction;
}

// Version 1 added CPU-only rest rounds alongside the player's next game.
// Undo those repeatable simulated results, preserving all actual player games.
function repairExtraRounds(league) {
  const teams = league.teams.map((team) => ({ ...team }));
  const byId = new Map(teams.map((team) => [team.id, team]));
  for (let round = 0; round < league.round; round += 1) {
    const fixtures = getRoundFixtures(league, round);
    if (fixtures.some((pair) => pair.includes(PLAYER_TEAM_ID))) continue;
    for (const [a, b] of fixtures) {
      const [scoreA, scoreB] = simulatedScores(round, a, b);
      updateRecord(byId.get(a), scoreA, scoreB, -1);
      updateRecord(byId.get(b), scoreB, scoreA, -1);
    }
  }
  return { ...league, version: 2, teams };
}

export function recordLeagueGame(profile, result) {
  const league = getLeague(profile);
  const next = getNextLeagueGame(profile);
  if (!next || (result.seasonNumber ?? 1) !== next.seasonNumber
    || result.leagueRound !== next.round || result.opponentId !== next.opponent.id
    || !Number.isInteger(result.playerScore) || result.playerScore < 0
    || !Number.isInteger(result.aiScore) || result.aiScore < 0) return league;

  const teams = league.teams.map((team) => ({ ...team }));
  const byId = new Map(teams.map((team) => [team.id, team]));
  function record(a, b, scoreA, scoreB) {
    for (const [id, scored, allowed] of [[a, scoreA, scoreB], [b, scoreB, scoreA]]) {
      const team = byId.get(id);
      updateRecord(team, scored, allowed);
    }
  }
  // One finished player game is one league day: process only its fixtures.
  // Skipped player rest rounds never create extra computer games.
  for (const [a, b] of getRoundFixtures(league, next.round)) {
    if (a === PLAYER_TEAM_ID || b === PLAYER_TEAM_ID) {
      record(PLAYER_TEAM_ID, next.opponent.id, result.playerScore, result.aiScore);
    } else {
      const [scoreA, scoreB] = simulatedScores(next.round, a, b);
      record(a, b, scoreA, scoreB);
    }
  }
  return { ...league, round: next.round + 1, teams };
}

export function getStandings(profile) {
  return getLeague(profile).teams.map((team) => {
    const gamesPlayed = team.wins + team.losses + team.ties;
    return {
      ...team,
      name: team.id === PLAYER_TEAM_ID ? profile.teamName : team.name,
      primary: team.id === PLAYER_TEAM_ID ? profile.teamColor.primary : team.primary,
      gamesPlayed,
      percentage: gamesPlayed ? (team.wins + team.ties / 2) / gamesPlayed : 0,
    };
  }).sort((a, b) => b.percentage - a.percentage || b.wins - a.wins
    || (b.runsFor - b.runsAgainst) - (a.runsFor - a.runsAgainst)
    || a.name.localeCompare(b.name));
}
