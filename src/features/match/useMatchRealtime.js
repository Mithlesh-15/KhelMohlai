import { useEffect } from "react";
import { supabase } from "../../utils/supabase";

function normalizeBallLabel(ball) {
  if (ball?.is_wicket) {
    return "W";
  }
  const extraType = String(ball?.extra_type ?? "").toUpperCase();
  if (extraType === "WD") {
    return "WD";
  }
  if (extraType === "NB") {
    return "NB";
  }
  return String(Number(ball?.runs) || 0);
}

export function useMatchRealtime({
  matchId,
  onLiveScoreEvent,
  onBallEvent,
}) {
  useEffect(() => {
    if (!matchId) {
      return undefined;
    }

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
          if (!next) {
            return;
          }

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
          if (!ball) {
            return;
          }

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

    return () => {
      supabase.removeChannel(inningsChannel);
      supabase.removeChannel(ballsChannel);
    };
  }, [matchId, onBallEvent, onLiveScoreEvent]);
}
