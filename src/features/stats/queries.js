import { supabase } from "../../utils/supabase";

export const statsQueryKeys = {
  overview: ["stats", "overview"],
};

function normalizeJoinedRecord(record) {
  if (!record) {
    return null;
  }

  if (Array.isArray(record)) {
    return record[0] ?? null;
  }

  return record;
}

function sortPlayers(items, primaryField) {
  return [...items].sort((first, second) => {
    if (second[primaryField] !== first[primaryField]) {
      return second[primaryField] - first[primaryField];
    }

    if (first.matchesPlayed !== second.matchesPlayed) {
      return first.matchesPlayed - second.matchesPlayed;
    }

    return String(first.playerName).localeCompare(
      String(second.playerName),
    );
  });
}

export async function fetchTopPlayerStats() {
  const [runsResponse, wicketsResponse] = await Promise.all([
    supabase
      .from("players")
      .select(`
        id,
        name,
        match,
        runs,
        team_id,
        teams:team_id(
          id,
          name,
          logo
        )
      `)
      .order("runs", { ascending: false })
      .order("match", { ascending: true })
      .limit(20),

    supabase
      .from("players")
      .select(`
        id,
        name,
        match,
        wicket,
        team_id,
        teams:team_id(
          id,
          name,
          logo
        )
      `)
      .order("wicket", { ascending: false })
      .order("match", { ascending: true })
      .limit(20),
  ]);

  if (runsResponse.error) {
    throw runsResponse.error;
  }

  if (wicketsResponse.error) {
    throw wicketsResponse.error;
  }

  const topRunScorers = sortPlayers(
    (runsResponse.data ?? []).map((player) => {
      const teamRecord = normalizeJoinedRecord(player.teams);

      return {
        playerId: player.id,
        playerName: player.name || "Unknown Player",
        matchesPlayed: Number(player.match) || 0,
        runs: Number(player.runs) || 0,
        teamName: teamRecord?.name || "Unknown Team",
        teamLogo: teamRecord?.logo || "",
      };
    }),
    "runs",
  ).slice(0, 5);

  const topWicketTakers = sortPlayers(
    (wicketsResponse.data ?? []).map((player) => {
      const teamRecord = normalizeJoinedRecord(player.teams);

      return {
        playerId: player.id,
        playerName: player.name || "Unknown Player",
        matchesPlayed: Number(player.match) || 0,
        wickets: Number(player.wicket) || 0,
        teamName: teamRecord?.name || "Unknown Team",
        teamLogo: teamRecord?.logo || "",
      };
    }),
    "wickets",
  ).slice(0, 5);

  return {
    topRunScorers,
    topWicketTakers,
  };
}