import { supabase } from "../../utils/supabase";

const FALLBACK_TEAM = {
  id: null,
  name: "TBD",
  logo: "",
};

const SPECIAL_STAGES = new Set(["final", "semi_final", "eliminator"]);

export const homeQueryKeys = {
  teams: ["teams"],
  matches: ["matches"],
  matchesWithTeams: ["matches-with-teams"],
};

export async function fetchTeams() {
  const { data, error } = await supabase.from("teams").select("id, name, logo");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, start_time, status, stage")
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function normalizeStatus(status) {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (value === "completed" || value === "complete" || value === "finished") {
    return "completed";
  }

  if (value === "live" || value === "ongoing" || value === "in_progress") {
    return "live";
  }

  return "upcoming";
}

function normalizeStage(stage) {
  const value = String(stage ?? "")
    .trim()
    .toLowerCase();

  if (SPECIAL_STAGES.has(value)) {
    return value;
  }

  return null;
}

function normalizeTeam(team) {
  if (!team?.name || !team?.logo) {
    return FALLBACK_TEAM;
  }

  return {
    id: team.id ?? null,
    name: team.name,
    logo: team.logo,
  };
}

function formatMatchStartTime(startTime) {
  if (!startTime) {
    return "Time not announced";
  }

  const matchDate = new Date(startTime);

  if (Number.isNaN(matchDate.getTime())) {
    return "Time not announced";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const matchDay = new Date(
    matchDate.getFullYear(),
    matchDate.getMonth(),
    matchDate.getDate(),
  );

  let dayLabel = matchDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  if (matchDay.getTime() === today.getTime()) {
    dayLabel = "Today";
  } else if (matchDay.getTime() === tomorrow.getTime()) {
    dayLabel = "Tomorrow";
  }

  const timeLabel = matchDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dayLabel}, ${timeLabel}`;
}

export function mapMatchesWithTeams(matches, teams) {
  const teamMap = new Map(
    (teams ?? []).map((team) => [team.id, normalizeTeam(team)]),
  );

  return (matches ?? []).map((match) => {
    const normalizedStatus = normalizeStatus(match.status);

    return {
      ...match,
      status: normalizedStatus,
      stage: normalizeStage(match.stage),
      formattedStartTime: formatMatchStartTime(match.start_time),
      team1: normalizeTeam(teamMap.get(match.team1_id)),
      team2: normalizeTeam(teamMap.get(match.team2_id)),
    };
  });
}

export function filterMatchesByTab(matches, tab) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const isToday = (value) => {
    const date = new Date(value);
    return date >= todayStart && date < tomorrowStart;
  };
  const byStartTime = (a, b) => {
    const first = new Date(a.start_time).getTime();
    const second = new Date(b.start_time).getTime();
    return first - second;
  };

  if (tab === "completed") {
    return matches
      .filter((match) => match.status === "completed")
      .sort(byStartTime);
  }

  if (tab === "upcoming") {
    return matches
      .filter((match) => {
        if (match.status === "completed" || match.status === "live") {
          return false;
        }

        const date = new Date(match.start_time);
        return Number.isNaN(date.getTime()) ? false : date >= tomorrowStart;
      })
      .sort(byStartTime);
  }

  const todaysMatches = matches.filter((match) => {
    if (match.status === "live") {
      return true;
    }

    return isToday(match.start_time);
  });

  return todaysMatches.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") {
      return -1;
    }

    if (a.status !== "live" && b.status === "live") {
      return 1;
    }

    return byStartTime(a, b);
  });
}
