import { supabase } from "../../utils/supabase";

const FALLBACK_LOGO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="%23dbe7ff"/><text x="50%" y="56%" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="%230145f2">T</text></svg>';

export const leaderboardQueryKeys = {
  table: ["leaderboard", "table"],
};

export function calculateNetRunRate({
  runsScored = 0,
  ballsFaced = 0,
  runsConceded = 0,
  ballsBowled = 0,
}) {
  const faced = Number(ballsFaced) || 0;
  const bowled = Number(ballsBowled) || 0;

  if (faced <= 0 || bowled <= 0) {
    return 0;
  }

  const scoredRate = (Number(runsScored) || 0) / (faced / 6);
  const concededRate = (Number(runsConceded) || 0) / (bowled / 6);
  const nrr = scoredRate - concededRate;

  if (!Number.isFinite(nrr)) {
    return 0;
  }

  return Number(nrr.toFixed(3));
}

export async function fetchLeaderboardTable() {
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, logo, state, played, wins, losses, points, runs_scored, balls_faced, runs_conceded, balls_bowled",
    );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((team) => {
      const computedNrr = calculateNetRunRate({
        runsScored: team.runs_scored,
        ballsFaced: team.balls_faced,
        runsConceded: team.runs_conceded,
        ballsBowled: team.balls_bowled,
      });

      return {
        id: team.id,
        name: team.name || "Unnamed Team",
        logo: team.logo || FALLBACK_LOGO,
        state: team.state ?? null,
        played: Number(team.played) || 0,
        wins: Number(team.wins) || 0,
        losses: Number(team.losses) || 0,
        points: Number(team.points) || 0,
        netRunRate: computedNrr,
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      return b.netRunRate - a.netRunRate;
    })
    .map((team, index) => ({
      ...team,
      position: index + 1,
    }));
}
