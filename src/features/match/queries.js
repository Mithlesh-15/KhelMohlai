import { supabase } from "../../utils/supabase";

export const matchQueryKeys = {
  detail: (matchId) => ["match", "detail", matchId],
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

function formatBall(ball) {
  const runs = pickNumber(ball?.runs, 0);
  const isWicket = Boolean(ball?.is_wicket ?? ball?.isWicket);
  const extraType = String(ball?.extra_type ?? ball?.extraType ?? "").toUpperCase();

  let label = String(runs);
  if (isWicket) {
    label = "W";
  } else if (extraType === "WD") {
    label = "WD";
  } else if (extraType === "NB") {
    label = "NB";
  }

  return {
    id: ball?.id ?? `ball-${Math.random()}`,
    runs,
    isWicket,
    extraType,
    label,
  };
}

function mapScorecardRows(rows, type) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const name =
      row.player_name ?? row.name ?? row.batter_name ?? row.bowler_name ?? "Unknown";

    if (type === "batter") {
      const runs = pickNumber(row.runs);
      const balls = pickNumber(row.balls);
      return {
        id: row.id ?? `${name}-${Math.random()}`,
        inningsId: row.innings_id ?? row.inning_id ?? null,
        name,
        runs,
        balls,
        fours: pickNumber(row.fours ?? row.four ?? row.boundary_4s),
        sixes: pickNumber(row.sixes ?? row.six ?? row.boundary_6s),
        strikeRate: balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0,
      };
    }

    const balls = pickNumber(row.balls_bowled ?? row.balls);
    const runsConceded = pickNumber(row.runs_conceded ?? row.runs);
    const overs =
      row.overs != null
        ? String(row.overs)
        : `${Math.floor(balls / 6)}.${balls % 6}`;
    const economy = balls > 0 ? Number(((runsConceded * 6) / balls).toFixed(2)) : 0;

    return {
      id: row.id ?? `${name}-${Math.random()}`,
      inningsId: row.innings_id ?? row.inning_id ?? null,
      name,
      overs,
      runs: runsConceded,
      wickets: pickNumber(row.wickets),
      economy,
    };
  });
}

export async function fetchMatchDetails(matchId) {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError) {
    throw matchError;
  }

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean);
  const [{ data: teams, error: teamsError }, { data: innings, error: inningsError }, { data: balls, error: ballsError }, { data: batterRows, error: batterError }, { data: bowlerRows, error: bowlerError }] = await Promise.all([
    supabase.from("teams").select("id, name, logo").in("id", teamIds),
    supabase.from("innings").select("*").eq("match_id", matchId).order("id", { ascending: true }),
    supabase
      .from("balls")
      .select("id, runs, is_wicket, extra_type, innings_id")
      .eq("match_id", matchId)
      .order("id", { ascending: false })
      .limit(12),
    supabase.from("player_stats").select("*").eq("match_id", matchId),
    supabase.from("player_stats").select("*").eq("match_id", matchId),
  ]);

  if (teamsError) {
    throw teamsError;
  }
  if (inningsError) {
    throw inningsError;
  }
  if (ballsError) {
    throw ballsError;
  }
  if (batterError) {
    throw batterError;
  }
  if (bowlerError) {
    throw bowlerError;
  }

  const teamsMap = new Map((teams ?? []).map((team) => [team.id, {
    id: team.id,
    name: team.name || FALLBACK_TEAM.name,
    logo: team.logo || FALLBACK_TEAM.logo,
  }]));

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

  const inningsById = Object.fromEntries(
    normalizedInnings.map((item) => [String(item.id), item]),
  );
  const scorecardsByInnings = {
    batter: {},
    bowler: {},
  };

  for (const row of mapScorecardRows(batterRows, "batter")) {
    const inningsId = row.inningsId;
    if (!inningsId) {
      continue;
    }
    const key = String(inningsId);
    if (!scorecardsByInnings.batter[key]) {
      scorecardsByInnings.batter[key] = [];
    }
    scorecardsByInnings.batter[key].push(row);
  }

  for (const row of mapScorecardRows(bowlerRows, "bowler")) {
    const inningsId = row.inningsId;
    if (!inningsId) {
      continue;
    }
    const key = String(inningsId);
    if (!scorecardsByInnings.bowler[key]) {
      scorecardsByInnings.bowler[key] = [];
    }
    scorecardsByInnings.bowler[key].push(row);
  }

  const firstInnings = normalizedInnings.find((item) => item.inningsNumber === 1) ?? normalizedInnings[0] ?? null;
  const secondInnings = normalizedInnings.find((item) => item.inningsNumber === 2) ?? normalizedInnings[1] ?? null;
  const latestInnings = normalizedInnings[normalizedInnings.length - 1] ?? null;

  const liveBalls = (balls ?? []).slice().reverse().map(formatBall);

  return {
    match: {
      ...match,
      status: String(match.status ?? "live").toLowerCase(),
      team1: teamsMap.get(match.team1_id) ?? FALLBACK_TEAM,
      team2: teamsMap.get(match.team2_id) ?? FALLBACK_TEAM,
    },
    innings: {
      all: normalizedInnings,
      first: firstInnings,
      second: secondInnings,
      latest: latestInnings,
      byId: inningsById,
    },
    scorecards: {
      batter: scorecardsByInnings.batter,
      bowler: scorecardsByInnings.bowler,
    },
    live: {
      inningsId: latestInnings?.id ?? null,
      runs: pickNumber(latestInnings?.runs),
      wickets: pickNumber(latestInnings?.wickets),
      balls: pickNumber(latestInnings?.balls),
      lastBalls: liveBalls,
    },
  };
}

export async function fetchSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}
