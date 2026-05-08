import { supabase } from "../../utils/supabase";

export const matchQueryKeys = {
  detail: (matchId) => ["match", "detail", matchId],
  teamPlayers: (teamId) => ["team", "players", teamId],
};

const FALLBACK_TEAM = {
  id: null,
  name: "TBD",
  logo: "",
};

function pickNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pickInningsNumber(innings, index) {
  const explicit = pickNumber(
    innings.innings_number ?? innings.inning_number ?? innings.number,
    NaN,
  );

  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  return index + 1;
}

function mapScorecardRows(rows, type, playerNameMap = new Map()) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const name =
      row.player_name ??
      row.name ??
      row.batter_name ??
      row.bowler_name ??
      playerNameMap.get(String(row.player_id ?? "")) ??
      "Unknown";

    if (type === "batter") {
      const runs = pickNumber(row.runs);
      const balls = pickNumber(row.balls);
      return {
        id: row.id ?? `${name}-${Math.random()}`,
        inningsId: row.innings_id ?? row.inning_id ?? null,
        playerId: row.player_id ?? null,
        role: row.role ?? "batter",
        name,
        runs,
        balls,
        isOut: Boolean(row.is_out ?? row.out ?? false),
        strikeRate: balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0,
      };
    }

    const balls = pickNumber(row.balls_bowled ?? row.balls);
    const runsConceded = pickNumber(row.runs_conceded ?? row.runs);
    const overs =
      row.overs != null
        ? String(row.overs)
        : `${Math.floor(balls / 6)}.${balls % 6}`;
    const economy =
      balls > 0 ? Number(((runsConceded * 6) / balls).toFixed(2)) : 0;

    return {
      id: row.id ?? `${name}-${Math.random()}`,
      inningsId: row.innings_id ?? row.inning_id ?? null,
      playerId: row.player_id ?? null,
      role: row.role ?? "bowler",
      name,
      ballsBowled: balls,
      overs,
      runs: runsConceded,
      wickets: pickNumber(row.wickets),
      economy,
    };
  });
}

export async function fetchTeamPlayers(teamId) {
  if (!teamId) {
    return [];
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, team_id, name")
    .eq("team_id", teamId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchMatchDetails(matchId) {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, team1_id, team2_id, current_innings, striker_id, non_striker_id, current_bowler_id, status",
    )
    .eq("id", matchId)
    .single();

  if (matchError) {
    throw matchError;
  }

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean);
  const [
    { data: teams, error: teamsError },
    { data: innings, error: inningsError },
    { data: stats, error: statsError },
    { data: players, error: playersError },
  ] = await Promise.all([
    supabase.from("teams").select("id, name, logo").in("id", teamIds),
    supabase
      .from("innings")
      .select(
        "id, match_id, batting_team_id, bowling_team_id, runs, wickets, balls, inning_number, innings_number, status",
      )
      .eq("match_id", matchId)
      .order("id", { ascending: true }),
    supabase
      .from("player_stats")
      .select(
        "id, match_id, innings_id, player_id, role, runs, balls,is_out, balls_bowled, runs_conceded, wickets",
      )
      .eq("match_id", matchId),
    supabase.from("players").select("id, name, team_id").in("team_id", teamIds),
  ]);

  if (teamsError) throw teamsError;
  if (inningsError) throw inningsError;
  if (statsError) throw statsError;
  if (playersError) throw playersError;

  const playerNameMap = new Map(
    (players ?? []).map((player) => [
      String(player.id),
      player.name ?? "Unknown",
    ]),
  );

  const teamsMap = new Map(
    (teams ?? []).map((team) => [
      team.id,
      {
        id: team.id,
        name: team.name || FALLBACK_TEAM.name,
        logo: team.logo || FALLBACK_TEAM.logo,
      },
    ]),
  );

  const normalizedInnings = (innings ?? []).map((item, index) => {
    const runs = pickNumber(item.runs);
    const wickets = pickNumber(item.wickets);
    const ballsValue = pickNumber(item.balls);
    return {
      ...item,
      inningsNumber: pickInningsNumber(item, index),
      runs,
      wickets,
      balls: ballsValue,
      oversLabel: `${Math.floor(ballsValue / 6)}.${ballsValue % 6}`,
    };
  });

  const scorecardsByInnings = { batter: {}, bowler: {} };
  for (const row of mapScorecardRows(stats, "batter", playerNameMap)) {
    if (row.role !== "batter" || !row.inningsId) continue;
    const key = String(row.inningsId);
    if (!scorecardsByInnings.batter[key]) scorecardsByInnings.batter[key] = [];
    scorecardsByInnings.batter[key].push(row);
  }
  for (const row of mapScorecardRows(stats, "bowler", playerNameMap)) {
    if (row.role !== "bowler" || !row.inningsId) continue;
    const key = String(row.inningsId);
    if (!scorecardsByInnings.bowler[key]) scorecardsByInnings.bowler[key] = [];
    scorecardsByInnings.bowler[key].push(row);
  }

  const firstInnings =
    normalizedInnings.find((item) => item.inningsNumber === 1) ??
    normalizedInnings[0] ??
    null;
  const secondInnings =
    normalizedInnings.find((item) => item.inningsNumber === 2) ??
    normalizedInnings[1] ??
    null;
  const latestInnings = normalizedInnings[normalizedInnings.length - 1] ?? null;

  return {
    match: {
      ...match,
      status: String(match.status ?? "upcoming").toLowerCase(),
      team1: teamsMap.get(match.team1_id) ?? FALLBACK_TEAM,
      team2: teamsMap.get(match.team2_id) ?? FALLBACK_TEAM,
    },
    innings: {
      all: normalizedInnings,
      first: firstInnings,
      second: secondInnings,
      latest: latestInnings,
    },
    scorecards: scorecardsByInnings,
    live: {
      inningsId: match.current_innings ?? latestInnings?.id ?? null,
      runs: pickNumber(latestInnings?.runs),
      wickets: pickNumber(latestInnings?.wickets),
      balls: pickNumber(latestInnings?.balls),
      battingTeamId: latestInnings?.batting_team_id ?? null,
      bowlingTeamId: latestInnings?.bowling_team_id ?? null,
      strikerId: match.striker_id ?? null,
      nonStrikerId: match.non_striker_id ?? null,
      currentBowlerId: match.current_bowler_id ?? null,
    },
  };
}

export async function fetchSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
