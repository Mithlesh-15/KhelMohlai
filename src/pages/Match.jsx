import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../utils/supabase";
import AdminPanel from "../features/match/components/AdminPanel";
import LastBalls from "../features/match/components/LastBalls";
import BatterTable from "../features/match/components/BatterTable";
import BowlerTable from "../features/match/components/BowlerTable";
import {
  fetchMatchDetails,
  fetchSession,
  matchQueryKeys,
} from "../features/match/queries";
import { useMatchRealtime } from "../features/match/useMatchRealtime";

function formatOvers(totalBalls) {
  const balls = Number(totalBalls) || 0;
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function TeamCell({ team, align = "left", score, note }) {
  const isRight = align === "right";

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${isRight ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <div
        className="h-12 w-12 overflow-hidden rounded-2xl border bg-slate-50"
        style={{ borderColor: "var(--border-soft)" }}
      >
        {team?.logo ? (
          <img
            src={team.logo}
            alt={`${team?.name ?? "Team"} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            {String(team?.name ?? "T").slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">
          {team?.name ?? "TBD"}
        </p>
        <p className="truncate text-xs text-slate-500">{score || "-"}</p>
        <p className="truncate text-xs text-slate-500">{note}</p>
      </div>
    </div>
  );
}

function InningsSection({ title, innings, batterRows, bowlerRows }) {
  return (
    <section className="surface-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-slate-500">
          {innings
            ? `${innings.runs}/${innings.wickets} (${innings.oversLabel})`
            : "Yet to Start"}
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Batters</h4>
          <BatterTable rows={batterRows} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Bowlers</h4>
          <BowlerTable rows={bowlerRows} />
        </div>
      </div>
    </section>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="surface-card animate-pulse">
        <div
          className="h-24 rounded-2xl"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
      </div>
      <div className="surface-card animate-pulse">
        <div
          className="h-40 rounded-2xl"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
      </div>
    </div>
  );
}

function Match() {
  const { matchId } = useParams();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [liveState, setLiveState] = useState({
    inningsId: null,
    runs: 0,
    wickets: 0,
    balls: 0,
    lastBalls: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const matchQuery = useQuery({
    queryKey: matchQueryKeys.detail(matchId),
    queryFn: () => fetchMatchDetails(matchId),
    enabled: Boolean(matchId),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const activeSession = await fetchSession();
      if (!isMounted) {
        return;
      }
      setSession(activeSession);
      setIsSessionLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!matchQuery.data?.live) {
      return;
    }

    setLiveState(matchQuery.data.live);
  }, [matchQuery.data]);

  const syncLiveToCache = useCallback(
    (nextLive) => {
      queryClient.setQueryData(matchQueryKeys.detail(matchId), (prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          live: {
            ...prev.live,
            ...nextLive,
          },
        };
      });
    },
    [matchId, queryClient],
  );

  const onLiveScoreEvent = useCallback(
    (event) => {
      setLiveState((prev) => {
        const next = { ...prev, ...event };
        syncLiveToCache(next);
        return next;
      });
    },
    [syncLiveToCache],
  );

  const onBallEvent = useCallback(
    (ball) => {
      setLiveState((prev) => {
        const lastBalls = [...(prev.lastBalls ?? []), ball].slice(-12);
        const next = { ...prev, lastBalls };
        syncLiveToCache(next);
        return next;
      });
    },
    [syncLiveToCache],
  );

  useMatchRealtime({
    matchId,
    onLiveScoreEvent,
    onBallEvent,
  });

  const base = matchQuery.data;
  const latestInnings = useMemo(() => {
    if (!base?.innings?.all?.length) {
      return null;
    }

    return (
      base.innings.all.find((inning) => inning.id === liveState.inningsId) ||
      base.innings.latest
    );
  }, [base, liveState.inningsId]);

  const firstScore = base?.innings?.first
    ? `${base.innings.first.runs}/${base.innings.first.wickets}`
    : "Yet to Bat";
  const secondScore = base?.innings?.second
    ? `${base.innings.second.runs}/${base.innings.second.wickets}`
    : "Yet to Bat";

  const team1IsBatting =
    latestInnings?.batting_team_id === base?.match?.team1_id;
  const team2IsBatting =
    latestInnings?.batting_team_id === base?.match?.team2_id;

  const team1Note = team1IsBatting
    ? "Batting"
    : base?.innings?.first
      ? firstScore
      : "Yet to Bat";
  const team2Note = team2IsBatting
    ? "Batting"
    : base?.innings?.second
      ? secondScore
      : "Yet to Bat";

  const handleAdminAction = useCallback(
    async (action) => {
      if (!session || !base) {
        return;
      }

      setActionError("");
      setIsSubmitting(true);

      const currentInnings = latestInnings ?? base.innings.latest;
      if (!currentInnings?.id) {
        setActionError("No innings record found for scoring.");
        setIsSubmitting(false);
        return;
      }

      const previous = {
        ...liveState,
        lastBalls: [...(liveState.lastBalls ?? [])],
      };

      try {
        if (action.undo) {
          const { data: lastBall, error: lastBallError } = await supabase
            .from("balls")
            .select("id, runs, is_wicket, extra_type")
            .eq("match_id", matchId)
            .eq("innings_id", currentInnings.id)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastBallError) {
            throw lastBallError;
          }

          if (!lastBall) {
            setIsSubmitting(false);
            return;
          }

          const lastExtra = String(lastBall.extra_type ?? "").toUpperCase();
          const reduceBallCount =
            lastExtra === "WD" || lastExtra === "NB" ? 0 : 1;

          setLiveState((prev) => ({
            ...prev,
            runs: Math.max(0, (prev.runs ?? 0) - (Number(lastBall.runs) || 0)),
            wickets: Math.max(
              0,
              (prev.wickets ?? 0) - (lastBall.is_wicket ? 1 : 0),
            ),
            balls: Math.max(0, (prev.balls ?? 0) - reduceBallCount),
            lastBalls: (prev.lastBalls ?? []).slice(0, -1),
          }));

          const { error: deleteError } = await supabase
            .from("balls")
            .delete()
            .eq("id", lastBall.id);
          if (deleteError) {
            throw deleteError;
          }

          const { error: inningsUpdateError } = await supabase
            .from("innings")
            .update({
              runs: Math.max(
                0,
                (liveState.runs ?? 0) - (Number(lastBall.runs) || 0),
              ),
              wickets: Math.max(
                0,
                (liveState.wickets ?? 0) - (lastBall.is_wicket ? 1 : 0),
              ),
              balls: Math.max(0, (liveState.balls ?? 0) - reduceBallCount),
            })
            .eq("id", currentInnings.id);

          if (inningsUpdateError) {
            throw inningsUpdateError;
          }
        } else {
          const ballIncrement =
            action.extraType === "WD" || action.extraType === "NB" ? 0 : 1;
          const nextBall = {
            id: `temp-${Date.now()}`,
            runs: action.runs,
            isWicket: action.isWicket,
            extraType: action.extraType,
            label: action.isWicket
              ? "W"
              : (action.extraType ?? String(action.runs)),
          };

          const optimistic = {
            ...liveState,
            runs: (liveState.runs ?? 0) + action.runs,
            wickets: (liveState.wickets ?? 0) + (action.isWicket ? 1 : 0),
            balls: (liveState.balls ?? 0) + ballIncrement,
            inningsId: currentInnings.id,
            lastBalls: [...(liveState.lastBalls ?? []), nextBall].slice(-12),
          };

          setLiveState(optimistic);

          const { error: ballError } = await supabase.from("balls").insert({
            match_id: matchId,
            innings_id: currentInnings.id,
            runs: action.runs,
            is_wicket: action.isWicket,
            extra_type: action.extraType,
          });

          if (ballError) {
            throw ballError;
          }

          const { error: inningsError } = await supabase
            .from("innings")
            .update({
              runs: optimistic.runs,
              wickets: optimistic.wickets,
              balls: optimistic.balls,
            })
            .eq("id", currentInnings.id);

          if (inningsError) {
            throw inningsError;
          }
        }

        queryClient.invalidateQueries({
          queryKey: matchQueryKeys.detail(matchId),
          refetchType: "inactive",
        });
      } catch (error) {
        setLiveState(previous);
        setActionError("Scoring update failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [base, latestInnings, liveState, matchId, queryClient, session],
  );

  const batterFor = (inningsId) => {
    if (!inningsId) {
      return [];
    }
    return base?.scorecards?.batter?.[String(inningsId)] ?? [];
  };
  const bowlerFor = (inningsId) => {
    if (!inningsId) {
      return [];
    }
    return base?.scorecards?.bowler?.[String(inningsId)] ?? [];
  };

  return (
    <div className="app-shell">
      <NavBar />
      <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {matchQuery.isLoading ? <MatchSkeleton /> : null}

          {matchQuery.isError ? (
            <section
              className="feedback-panel"
              style={{
                backgroundColor: "#fffaf9",
                borderColor: "rgba(248, 113, 113, 0.24)",
              }}
            >
              <h2 className="text-base font-semibold">Unable to load match</h2>
              <p className="mt-2 text-sm text-slate-500">
                Please try again shortly.
              </p>
            </section>
          ) : null}

          {base ? (
            <>
              <section className="surface-card sticky top-2 z-20">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <TeamCell
                    team={base.match.team1}
                    score={firstScore}
                    note={team1Note}
                  />
                  <div className="px-2 text-center">
                    <p className="text-3xl font-bold tracking-tight">
                      {liveState.runs}/{liveState.wickets}
                    </p>
                    <p className="text-sm text-slate-500">
                      Overs {formatOvers(liveState.balls)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-blue-600">
                      {base.match.status}
                    </p>
                  </div>
                  <TeamCell
                    team={base.match.team2}
                    align="right"
                    score={secondScore}
                    note={team2Note}
                  />
                </div>
              </section>

              <LastBalls balls={liveState.lastBalls} />
              {!isSessionLoading && session ? (
                <AdminPanel
                  disabled={!latestInnings?.id}
                  onAction={handleAdminAction}
                  isSubmitting={isSubmitting}
                />
              ) : null}

              <InningsSection
                title="First Innings"
                innings={base.innings.first}
                batterRows={batterFor(base.innings.first?.id)}
                bowlerRows={bowlerFor(base.innings.first?.id)}
              />

              <InningsSection
                title="Second Innings"
                innings={base.innings.second}
                batterRows={batterFor(base.innings.second?.id)}
                bowlerRows={bowlerFor(base.innings.second?.id)}
              />

              {actionError ? (
                <section
                  className="feedback-panel"
                  style={{
                    backgroundColor: "#fffaf9",
                    borderColor: "rgba(248, 113, 113, 0.24)",
                  }}
                >
                  <p className="text-sm text-slate-600">{actionError}</p>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Match;
