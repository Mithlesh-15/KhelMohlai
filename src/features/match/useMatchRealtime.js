import { useEffect } from "react";
import { supabase } from "../../utils/supabase";

export function useMatchRealtime({
  matchId,
  onLiveScoreEvent,
  onPlayerStatsEvent,
}) {
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
            strikerId: next.striker_id ?? null,
            nonStrikerId: next.non_striker_id ?? null,
            currentBowlerId: next.current_bowler_id ?? null,
            status: String(next.status ?? "live").toLowerCase(),
          });
        },
      )
      .subscribe();

    const playerStatsChannel = supabase
      .channel(`match-player-stats-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_stats",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (!payload?.new) return;
          onPlayerStatsEvent?.(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inningsChannel);
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(playerStatsChannel);
    };
  }, [matchId, onLiveScoreEvent, onPlayerStatsEvent]);
}
