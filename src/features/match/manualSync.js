import { supabase } from "../../utils/supabase";
import { ballsToOversLabel, clampNonNegativeInteger } from "./overs";

function computeStrikeRate(runs, balls) {
  if (!balls) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

function computeEconomy(runsConceded, ballsBowled) {
  if (!ballsBowled) return 0;
  return Number(((runsConceded * 6) / ballsBowled).toFixed(2));
}

export async function saveManualMatchSync({
  matchId,
  inningsId,
  summary,
  batters,
  bowlers,
  strikerId,
  nonStrikerId,
  currentBowlerId,
}) {
  if (!matchId || !inningsId) {
    throw new Error("Match and innings are required for manual sync.");
  }

  const inningsPatch = {
    runs: clampNonNegativeInteger(summary.runs),
    wickets: clampNonNegativeInteger(summary.wickets),
    balls: clampNonNegativeInteger(summary.balls),
  };

  const batterRows = (batters ?? []).map((row) => ({
    match_id: matchId,
    innings_id: inningsId,
    player_id: row.playerId,
    role: "batter",
    runs: clampNonNegativeInteger(row.runs),
    balls: clampNonNegativeInteger(row.balls),
  }));

  const bowlerRows = (bowlers ?? []).map((row) => ({
    match_id: matchId,
    innings_id: inningsId,
    player_id: row.playerId,
    role: "bowler",
    balls_bowled: clampNonNegativeInteger(row.ballsBowled),
    runs_conceded: clampNonNegativeInteger(row.runsConceded),
    wickets: clampNonNegativeInteger(row.wickets),
  }));

  const allPlayerRows = [...batterRows, ...bowlerRows].filter((row) => row.player_id);

  const { error: inningsError } = await supabase
    .from("innings")
    .update(inningsPatch)
    .eq("id", inningsId);
  if (inningsError) throw inningsError;

  const { error: matchError } = await supabase
    .from("matches")
    .update({
      striker_id: strikerId || null,
      non_striker_id: nonStrikerId || null,
      current_bowler_id: currentBowlerId || null,
    })
    .eq("id", matchId);
  if (matchError) throw matchError;

  if (allPlayerRows.length) {
    const { error: statsError } = await supabase.from("player_stats").upsert(allPlayerRows, {
      onConflict: "match_id,innings_id,player_id,role",
    });
    if (statsError) throw statsError;
  }

  return {
    live: {
      runs: inningsPatch.runs,
      wickets: inningsPatch.wickets,
      balls: inningsPatch.balls,
      strikerId: strikerId || null,
      nonStrikerId: nonStrikerId || null,
      currentBowlerId: currentBowlerId || null,
    },
    inningsPatch: {
      ...inningsPatch,
      oversLabel: ballsToOversLabel(inningsPatch.balls),
    },
    normalizedScorecards: {
      batter: batterRows.map((row) => ({
        inningsId,
        playerId: row.player_id,
        role: "batter",
        runs: row.runs,
        balls: row.balls,
        strikeRate: computeStrikeRate(row.runs, row.balls),
      })),
      bowler: bowlerRows.map((row) => ({
        inningsId,
        playerId: row.player_id,
        role: "bowler",
        ballsBowled: row.balls_bowled,
        runs: row.runs_conceded,
        wickets: row.wickets,
        overs: ballsToOversLabel(row.balls_bowled),
        economy: computeEconomy(row.runs_conceded, row.balls_bowled),
      })),
    },
  };
}
