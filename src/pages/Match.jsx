import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../utils/supabase";
import AdminPanel from "../features/match/components/AdminPanel";
import BatterTable from "../features/match/components/BatterTable";
import BowlerTable from "../features/match/components/BowlerTable";
import StartMatchModal from "../features/match/components/StartMatchModal";
import ExtrasModal from "../features/match/components/ExtrasModal";
import NewBowlerModal from "../features/match/components/NewBowlerModal";
import NewBatterModal from "../features/match/components/NewBatterModal";
import CustomUpdateModal from "../features/match/components/CustomUpdateModal";
import NextInningsSetupModal from "../features/match/components/NextInningsSetupModal";
import {
  fetchMatchDetails,
  fetchSession,
  fetchTeamPlayers,
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

function Match() {
  const { matchId } = useParams();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showNewBowlerModal, setShowNewBowlerModal] = useState(false);
  const [showNewBatterModal, setShowNewBatterModal] = useState(false);
  const [showCustomUpdate, setShowCustomUpdate] = useState(false);
  const [showNextInningsModal, setShowNextInningsModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState("");
  const [pendingWicket, setPendingWicket] = useState(false);
  const [pendingNextInnings, setPendingNextInnings] = useState(null);

  const [liveState, setLiveState] = useState({
    inningsId: null,
    runs: 0,
    wickets: 0,
    balls: 0,
    battingTeamId: null,
    bowlingTeamId: null,
    strikerId: null,
    nonStrikerId: null,
    currentBowlerId: null,
    status: "upcoming",
  });

  const matchQuery = useQuery({
    queryKey: matchQueryKeys.detail(matchId),
    queryFn: () => fetchMatchDetails(matchId),
    enabled: Boolean(matchId),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    let mounted = true;
    fetchSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!matchQuery.data) return;
    setLiveState((prev) => ({
      ...prev,
      ...matchQuery.data.live,
      status: matchQuery.data.match.status,
    }));
  }, [matchQuery.data]);

  const base = matchQuery.data;
  const teams = useMemo(
    () => (base ? [base.match.team1, base.match.team2] : []),
    [base],
  );
  const battingTeamId = useMemo(() => {
    const inning =
      base?.innings?.all?.find((x) => x.id === liveState.inningsId) ??
      base?.innings?.latest;
    return inning?.batting_team_id ?? liveState.battingTeamId ?? null;
  }, [base, liveState.battingTeamId, liveState.inningsId]);
  const bowlingTeamId = useMemo(() => {
    const inning =
      base?.innings?.all?.find((x) => x.id === liveState.inningsId) ??
      base?.innings?.latest;
    return inning?.bowling_team_id ?? liveState.bowlingTeamId ?? null;
  }, [base, liveState.bowlingTeamId, liveState.inningsId]);

  const team1PlayersQuery = useQuery({
    queryKey: matchQueryKeys.teamPlayers(base?.match?.team1_id),
    queryFn: () => fetchTeamPlayers(base?.match?.team1_id),
    enabled: Boolean(base?.match?.team1_id),
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 2*60 * 60 * 1000
  });

  const team2PlayersQuery = useQuery({
    queryKey: matchQueryKeys.teamPlayers(base?.match?.team2_id),
    queryFn: () => fetchTeamPlayers(base?.match?.team2_id),
    enabled: Boolean(base?.match?.team2_id),
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 2*60 * 60 * 1000,
    refetchOnMount: false,
  });

  const battingPlayers = useMemo(() => {
    if (!battingTeamId) return [];
    return String(base?.match?.team1_id) === String(battingTeamId)
      ? (team1PlayersQuery.data ?? [])
      : (team2PlayersQuery.data ?? []);
  }, [base, battingTeamId, team1PlayersQuery.data, team2PlayersQuery.data]);

  const bowlingPlayers = useMemo(() => {
    if (!bowlingTeamId) return [];
    return String(base?.match?.team1_id) === String(bowlingTeamId)
      ? (team1PlayersQuery.data ?? [])
      : (team2PlayersQuery.data ?? []);
  }, [base, bowlingTeamId, team1PlayersQuery.data, team2PlayersQuery.data]);

  const syncCache = useCallback(
    (nextLive) => {
      queryClient.setQueryData(matchQueryKeys.detail(matchId), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          live: { ...prev.live, ...nextLive },
          match: {
            ...prev.match,
            status: nextLive.status ?? prev.match.status,
          },
        };
      });
    },
    [matchId, queryClient],
  );

  useMatchRealtime({
    matchId,
    onLiveScoreEvent: (event) =>
      setLiveState((prev) => {
        const next = { ...prev, ...event };
        syncCache(next);
        return next;
      }),
  });

  const upsertPlayerStats = useCallback(
    async ({ inningsId, playerId, role, patch }) => {
      if (!inningsId || !playerId || !role) return;
      const { data: existing } = await supabase
        .from("player_stats")
        .select("*")
        .eq("match_id", matchId)
        .eq("innings_id", inningsId)
        .eq("player_id", playerId)
        .eq("role", role)
        .maybeSingle();

      if (!existing) {
        await supabase.from("player_stats").insert({
          match_id: matchId,
          innings_id: inningsId,
          player_id: playerId,
          role,
          ...patch,
        });
        return;
      }

      const merged = { ...existing };
      for (const [key, value] of Object.entries(patch)) {
        if (typeof value === "number") {
          merged[key] = Number(existing[key] || 0) + value;
        } else {
          merged[key] = value;
        }
      }
      await supabase.from("player_stats").update(merged).eq("id", existing.id);
    },
    [matchId],
  );

  const startMatch = useCallback(
    async (payload) => {
      if (!base) return;
      setIsSubmitting(true);
      setError("");

      try {
        const { data: inning, error: inningError } = await supabase
          .from("innings")
          .insert({
            match_id: matchId,
            batting_team_id: payload.battingTeamId,
            bowling_team_id: payload.bowlingTeamId,
            runs: 0,
            wickets: 0,
            balls: 0,
            inning_number: 1,
            status: "live",
          })
          .select("id")
          .single();

        if (inningError) throw inningError;

        const { error: matchError } = await supabase
          .from("matches")
          .update({
            status: "live",
            current_innings: inning.id,
            striker_id: payload.strikerId,
            non_striker_id: payload.nonStrikerId,
            current_bowler_id: payload.bowlerId,
          })
          .eq("id", matchId);

        if (matchError) throw matchError;

        const next = {
          inningsId: inning.id,
          runs: 0,
          wickets: 0,
          balls: 0,
          battingTeamId: payload.battingTeamId,
          bowlingTeamId: payload.bowlingTeamId,
          strikerId: payload.strikerId,
          nonStrikerId: payload.nonStrikerId,
          currentBowlerId: payload.bowlerId,
          status: "live",
        };
        setLiveState(next);
        syncCache(next);
        setShowStartModal(false);
        queryClient.invalidateQueries({
          queryKey: matchQueryKeys.detail(matchId),
          refetchType: "inactive",
        });
      } catch (_e) {
        setError("Failed to start match.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [base, matchId, queryClient, syncCache],
  );

  const scoreBall = useCallback(
    async ({ runs, extraType = null, isWicket = false }) => {
      if (
        !liveState.inningsId ||
        !liveState.strikerId ||
        !liveState.currentBowlerId
      )
        return;
      setIsSubmitting(true);
      setError("");

      const isLegal = !(extraType === "WD" || extraType === "NB");
      const nextBalls = liveState.balls + (isLegal ? 1 : 0);
      const nextRuns = liveState.runs + runs;
      const nextWickets = liveState.wickets + (isWicket ? 1 : 0);
      const over = Math.floor(liveState.balls / 6);
      const ballNumber = (liveState.balls % 6) + 1;

      let strikerId = liveState.strikerId;
      let nonStrikerId = liveState.nonStrikerId;

      try {
        const { error: ballError } = await supabase.from("balls").insert({
          match_id: matchId,
          innings_id: liveState.inningsId,
          over,
          ball_number: ballNumber,
          runs,
          extra_type: extraType,
          is_wicket: isWicket,
          batsman_id: liveState.strikerId,
          bowler_id: liveState.currentBowlerId,
        });
        if (ballError) throw ballError;

        if (!isWicket && runs % 2 === 1) {
          strikerId = liveState.nonStrikerId;
          nonStrikerId = liveState.strikerId;
        }
        if (isLegal && nextBalls % 6 === 0) {
          const temp = strikerId;
          strikerId = nonStrikerId;
          nonStrikerId = temp;
        }

        await supabase
          .from("innings")
          .update({ runs: nextRuns, wickets: nextWickets, balls: nextBalls })
          .eq("id", liveState.inningsId);
        await supabase
          .from("matches")
          .update({ striker_id: strikerId, non_striker_id: nonStrikerId })
          .eq("id", matchId);

        const batterRuns = !extraType || extraType === "NB" ? runs : 0;
        const batterBalls = isLegal ? 1 : 0;
        const bowlerRuns =
          extraType === "LB" || extraType === "B" || extraType === "P"
            ? 0
            : runs;
        const bowlerBalls = isLegal ? 1 : 0;

        if (batterRuns > 0 || batterBalls > 0) {
          await upsertPlayerStats({
            inningsId: liveState.inningsId,
            playerId: liveState.strikerId,
            role: "batter",
            patch: {
              runs: batterRuns,
              balls: batterBalls,
            },
          });
        }
        await upsertPlayerStats({
          inningsId: liveState.inningsId,
          playerId: liveState.currentBowlerId,
          role: "bowler",
          patch: {
            runs_conceded: bowlerRuns,
            balls_bowled: bowlerBalls,
            wickets: isWicket ? 1 : 0,
          },
        });

        const next = {
          ...liveState,
          runs: nextRuns,
          wickets: nextWickets,
          balls: nextBalls,
          strikerId,
          nonStrikerId,
        };
        setLiveState(next);
        syncCache(next);

        if (isWicket) {
          setPendingWicket(true);
          setShowNewBatterModal(true);
        } else if (isLegal && nextBalls % 6 === 0) {
          setShowNewBowlerModal(true);
        }
      } catch (_e) {
        setError("Scoring update failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, syncCache, upsertPlayerStats],
  );

  const handleUndo = useCallback(async () => {
    if (!liveState.inningsId) return;
    setIsSubmitting(true);
    try {
      const { data: lastBall } = await supabase
        .from("balls")
        .select("id, runs, extra_type, is_wicket")
        .eq("match_id", matchId)
        .eq("innings_id", liveState.inningsId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lastBall) return;

      const legal = !(
        lastBall.extra_type === "WD" || lastBall.extra_type === "NB"
      );
      const next = {
        ...liveState,
        runs: Math.max(0, liveState.runs - Number(lastBall.runs || 0)),
        wickets: Math.max(0, liveState.wickets - (lastBall.is_wicket ? 1 : 0)),
        balls: Math.max(0, liveState.balls - (legal ? 1 : 0)),
      };

      await supabase.from("balls").delete().eq("id", lastBall.id);
      await supabase
        .from("innings")
        .update({ runs: next.runs, wickets: next.wickets, balls: next.balls })
        .eq("id", liveState.inningsId);
      setLiveState(next);
      syncCache(next);
    } catch (_e) {
      setError("Undo failed.");
    } finally {
      setIsSubmitting(false);
    }
  }, [liveState, matchId, syncCache]);

  const usedBatterIds = useMemo(() => {
    const set = new Set();
    const rows = base?.scorecards?.batter?.[String(liveState.inningsId)] ?? [];
    rows.forEach((row) => row.playerId && set.add(String(row.playerId)));
    if (liveState.strikerId) set.add(String(liveState.strikerId));
    if (liveState.nonStrikerId) set.add(String(liveState.nonStrikerId));
    return set;
  }, [base, liveState]);

  const remainingBatters = useMemo(
    () => battingPlayers.filter((p) => !usedBatterIds.has(String(p.id))),
    [battingPlayers, usedBatterIds],
  );

  const handleNewBatter = useCallback(
    async (batterId) => {
      const strikerId = pendingWicket ? batterId : liveState.strikerId;
      await supabase
        .from("matches")
        .update({ striker_id: strikerId })
        .eq("id", matchId);
      setLiveState((prev) => ({ ...prev, strikerId }));
      setPendingWicket(false);
      setShowNewBatterModal(false);
    },
    [liveState.strikerId, matchId, pendingWicket],
  );

  const handleNewBowler = useCallback(
    async (bowlerId) => {
      await supabase
        .from("matches")
        .update({ current_bowler_id: bowlerId })
        .eq("id", matchId);
      setLiveState((prev) => ({ ...prev, currentBowlerId: bowlerId }));
      setShowNewBowlerModal(false);
    },
    [matchId],
  );

  const handleCustomUpdate = useCallback(
    async (form) => {
      if (!liveState.inningsId) return;
      setIsSubmitting(true);
      try {
        await supabase
          .from("innings")
          .update({ runs: form.runs, wickets: form.wickets, balls: form.balls })
          .eq("id", liveState.inningsId);
        await supabase
          .from("matches")
          .update({
            striker_id: form.strikerId || null,
            non_striker_id: form.nonStrikerId || null,
            current_bowler_id: form.currentBowlerId || null,
          })
          .eq("id", matchId);
        const next = {
          ...liveState,
          runs: form.runs,
          wickets: form.wickets,
          balls: form.balls,
          strikerId: form.strikerId || null,
          nonStrikerId: form.nonStrikerId || null,
          currentBowlerId: form.currentBowlerId || null,
        };
        setLiveState(next);
        syncCache(next);
        setShowCustomUpdate(false);
      } catch (_e) {
        setError("Custom update failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, syncCache],
  );

  const handleCompleteInnings = useCallback(async () => {
    if (!base || !liveState.inningsId) return;
    setIsSubmitting(true);
    setError("");
    try {
      const currentInnings =
        base.innings.all.find((item) => item.id === liveState.inningsId) ??
        base.innings.latest;
      if (!currentInnings) return;

      await supabase
        .from("innings")
        .update({ status: "completed" })
        .eq("id", currentInnings.id);

      const inningsNumber = Number(
        currentInnings.inning_number ?? currentInnings.innings_number ?? 1,
      );
      const existingSecond = base.innings.all.find(
        (item) => Number(item.inning_number ?? item.innings_number ?? 0) === 2,
      );

      if (inningsNumber >= 2) {
        setError(
          "2nd innings is running. Use Complete Match button to finish the match.",
        );
        return;
      }

      let secondInningsId = existingSecond?.id ?? null;
      if (!secondInningsId) {
        const { data: secondInnings, error: secondInningsError } =
          await supabase
            .from("innings")
            .insert({
              match_id: matchId,
              batting_team_id: currentInnings.bowling_team_id,
              bowling_team_id: currentInnings.batting_team_id,
              runs: 0,
              wickets: 0,
              balls: 0,
              inning_number: 2,
              status: "live",
            })
            .select("id")
            .single();
        if (secondInningsError) throw secondInningsError;
        secondInningsId = secondInnings.id;
      }

      await supabase
        .from("innings")
        .update({ status: "live" })
        .eq("id", secondInningsId);

      const next = {
        ...liveState,
        status: "live",
      };
      setLiveState(next);
      syncCache(next);
      setPendingNextInnings({
        inningsId: secondInningsId,
        battingTeamId: currentInnings.bowling_team_id,
        bowlingTeamId: currentInnings.batting_team_id,
      });
      setShowNextInningsModal(true);
      setError("Select batters and bowler to start 2nd innings.");
    } catch (_e) {
      setError("Unable to complete innings.");
    } finally {
      setIsSubmitting(false);
    }
  }, [base, liveState, matchId, queryClient, syncCache]);

  const handleStartNextInningsPlayers = useCallback(
    async ({ strikerId, nonStrikerId, bowlerId }) => {
      if (!pendingNextInnings?.inningsId) return;
      setIsSubmitting(true);
      try {
        const { data: nextInningsRow, error: nextInningsError } = await supabase
          .from("innings")
          .select("runs, wickets, balls")
          .eq("id", pendingNextInnings.inningsId)
          .single();
        if (nextInningsError) throw nextInningsError;

        await supabase
          .from("matches")
          .update({
            status: "live",
            current_innings: pendingNextInnings.inningsId,
            striker_id: strikerId,
            non_striker_id: nonStrikerId,
            current_bowler_id: bowlerId,
          })
          .eq("id", matchId);

        const next = {
          ...liveState,
          inningsId: pendingNextInnings.inningsId,
          runs: Number(nextInningsRow?.runs || 0),
          wickets: Number(nextInningsRow?.wickets || 0),
          balls: Number(nextInningsRow?.balls || 0),
          battingTeamId: pendingNextInnings.battingTeamId,
          bowlingTeamId: pendingNextInnings.bowlingTeamId,
          strikerId,
          nonStrikerId,
          currentBowlerId: bowlerId,
          status: "live",
        };
        setLiveState(next);
        syncCache(next);
        setShowNextInningsModal(false);
        setPendingNextInnings(null);
        queryClient.invalidateQueries({
          queryKey: matchQueryKeys.detail(matchId),
          refetchType: "inactive",
        });
      } catch (_e) {
        setError("Unable to start next innings with selected players.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, pendingNextInnings, queryClient, syncCache],
  );

  const handleCompleteMatch = useCallback(async () => {
    if (!liveState.inningsId) return;
    setIsSubmitting(true);
    setError("");
    try {
      await supabase
        .from("innings")
        .update({ status: "completed" })
        .eq("id", liveState.inningsId);
      await supabase
        .from("matches")
        .update({ status: "completed", current_innings: liveState.inningsId })
        .eq("id", matchId);
      const next = { ...liveState, status: "completed" };
      setLiveState(next);
      syncCache(next);
      queryClient.invalidateQueries({
        queryKey: matchQueryKeys.detail(matchId),
        refetchType: "inactive",
      });
    } catch (_e) {
      setError("Unable to complete match.");
    } finally {
      setIsSubmitting(false);
    }
  }, [liveState, matchId, queryClient, syncCache]);

  const latestInnings =
    base?.innings?.all?.find((i) => i.id === liveState.inningsId) ??
    base?.innings?.latest;
  const firstScore = base?.innings?.first
    ? `${base.innings.first.runs}/${base.innings.first.wickets}`
    : "Yet to Bat";
  const secondScore = base?.innings?.second
    ? `${base.innings.second.runs}/${base.innings.second.wickets}`
    : "Yet to Bat";

  const batterFor = (inningsId) =>
    inningsId ? (base?.scorecards?.batter?.[String(inningsId)] ?? []) : [];
  const bowlerFor = (inningsId) =>
    inningsId ? (base?.scorecards?.bowler?.[String(inningsId)] ?? []) : [];
  const nextInningsBattingPlayers = pendingNextInnings?.battingTeamId
    ? String(base?.match?.team1_id) === String(pendingNextInnings.battingTeamId)
      ? (team1PlayersQuery.data ?? [])
      : (team2PlayersQuery.data ?? [])
    : [];
  const nextInningsBowlingPlayers = pendingNextInnings?.bowlingTeamId
    ? String(base?.match?.team1_id) === String(pendingNextInnings.bowlingTeamId)
      ? (team1PlayersQuery.data ?? [])
      : (team2PlayersQuery.data ?? [])
    : [];
  const nextInningsBattingName =
    teams.find(
      (team) => String(team.id) === String(pendingNextInnings?.battingTeamId),
    )?.name ?? "";
  const nextInningsBowlingName =
    teams.find(
      (team) => String(team.id) === String(pendingNextInnings?.bowlingTeamId),
    )?.name ?? "";

  return (
    <div className="app-shell">
      <NavBar />
      <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {base ? (
            <>
              <section className="surface-card sticky top-2 z-20">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <TeamCell
                    team={base.match.team1}
                    score={firstScore}
                    note={
                      latestInnings?.batting_team_id === base.match.team1_id
                        ? "Batting"
                        : ""
                    }
                  />
                  <div className="px-2 text-center">
                    <p className="text-3xl font-bold tracking-tight">
                      {liveState.runs}/{liveState.wickets}
                    </p>
                    <p className="text-sm text-slate-500">
                      Overs {formatOvers(liveState.balls)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-blue-600">
                      {liveState.status}
                    </p>
                  </div>
                  <TeamCell
                    team={base.match.team2}
                    align="right"
                    score={secondScore}
                    note={
                      latestInnings?.batting_team_id === base.match.team2_id
                        ? "Batting"
                        : ""
                    }
                  />
                </div>
              </section>

              {!isSessionLoading && session ? (
                <>
                  {liveState.status === "upcoming" ? (
                    <section className="surface-card">
                      <button
                        className="h-16 w-full rounded-2xl bg-slate-900 text-lg font-semibold text-white disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={() => {
                          team1PlayersQuery.refetch();
                          team2PlayersQuery.refetch();
                          setShowStartModal(true);
                        }}
                      >
                        Start Match
                      </button>
                    </section>
                  ) : (
                    <AdminPanel
                      disabled={!liveState.inningsId}
                      isSubmitting={isSubmitting}
                      status={liveState.status}
                      onRun={(runs) => scoreBall({ runs })}
                      onExtra={(type) => {
                        setPendingExtraType(type);
                        setShowExtrasModal(true);
                      }}
                      onWicket={() => scoreBall({ runs: 0, isWicket: true })}
                      onUndo={handleUndo}
                      onCustomUpdate={() => setShowCustomUpdate(true)}
                      onCompleteInnings={handleCompleteInnings}
                      onCompleteMatch={handleCompleteMatch}
                    />
                  )}
                </>
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

              {error ? (
                <section className="feedback-panel">
                  <p className="text-sm text-rose-600">{error}</p>
                </section>
              ) : null}

              <StartMatchModal
                open={showStartModal}
                teams={teams}
                teamPlayersMap={{
                  [String(base?.match?.team1_id)]: team1PlayersQuery.data ?? [],
                  [String(base?.match?.team2_id)]: team2PlayersQuery.data ?? [],
                }}
                onClose={() => setShowStartModal(false)}
                onConfirm={startMatch}
              />
              <ExtrasModal
                open={showExtrasModal}
                extraType={pendingExtraType}
                onClose={() => setShowExtrasModal(false)}
                onSelect={(runs) => {
                  setShowExtrasModal(false);
                  scoreBall({ runs, extraType: pendingExtraType });
                }}
              />
              <NewBowlerModal
                open={showNewBowlerModal}
                players={bowlingPlayers}
                currentBowlerId={liveState.currentBowlerId}
                onClose={() => setShowNewBowlerModal(false)}
                onConfirm={handleNewBowler}
              />
              <NewBatterModal
                open={showNewBatterModal}
                players={remainingBatters}
                onClose={() => setShowNewBatterModal(false)}
                onConfirm={handleNewBatter}
              />
              <CustomUpdateModal
                open={showCustomUpdate}
                current={liveState}
                onClose={() => setShowCustomUpdate(false)}
                onConfirm={handleCustomUpdate}
              />
              <NextInningsSetupModal
                open={showNextInningsModal}
                battingTeamName={nextInningsBattingName}
                bowlingTeamName={nextInningsBowlingName}
                battingPlayers={nextInningsBattingPlayers}
                bowlingPlayers={nextInningsBowlingPlayers}
                onClose={() => setShowNextInningsModal(false)}
                onConfirm={handleStartNextInningsPlayers}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Match;
