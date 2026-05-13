import { useEffect } from "react";
import { supabase } from "../../utils/supabase";

export function useMatchRealtime({
  matchId,
  onLiveScoreEvent,
}) {
  useEffect(() => {
    if (!matchId) return undefined;

    const matchChannel = supabase
      .channel(`match-${matchId}`)
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

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, onLiveScoreEvent]);
}
