import { useEffect } from "react";
import { supabase } from "../../utils/supabase";

function normalizeBallLabel(ball) {
  if (ball?.is_wicket) return "W";
  const extraType = String(ball?.extra_type ?? "").toUpperCase();
  if (extraType) return extraType;
  return String(Number(ball?.runs) || 0);
}

export function useMatchRealtime({ matchId, onLiveScoreEvent, onBallEvent }) {
  useEffect(() => {
    if (!matchId) return undefined;

    const inningsChannel = supabase
      .channel(`match-live-innings-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "innings",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const next = payload?.new;
          if (!next) return;
          onLiveScoreEvent?.({
            inningsId: next.id,
            runs: Number(next.runs) || 0,
            wickets: Number(next.wickets) || 0,
            balls: Number(next.balls) || 0,
          });
        },
      )
      .subscribe();

    const ballsChannel = supabase
      .channel(`match-live-balls-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "balls",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const ball = payload?.new;
          if (!ball) return;
          onBallEvent?.({
            id: ball.id,
            runs: Number(ball.runs) || 0,
            isWicket: Boolean(ball.is_wicket),
            extraType: String(ball.extra_type ?? "").toUpperCase(),
            label: normalizeBallLabel(ball),
          });
        },
      )
      .subscribe();

    const matchChannel = supabase
      .channel(`match-live-state-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const next = payload?.new;
          if (!next) return;
          onLiveScoreEvent?.({
            inningsId: next.current_innings ?? null,
            strikerId: next.striker_id ?? null,
            nonStrikerId: next.non_striker_id ?? null,
            currentBowlerId: next.current_bowler_id ?? null,
            status: String(next.status ?? "").toLowerCase(),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inningsChannel);
      supabase.removeChannel(ballsChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, onBallEvent, onLiveScoreEvent]);
}
