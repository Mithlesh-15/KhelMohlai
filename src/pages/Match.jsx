import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../utils/supabase";
import AdminPanel from "../features/match/components/AdminPanel";
import StartMatchModal from "../features/match/components/StartMatchModal";
import ExtrasModal from "../features/match/components/ExtrasModal";
import NewBowlerModal from "../features/match/components/NewBowlerModal";
import NewBatterModal from "../features/match/components/NewBatterModal";
import CustomUpdateModal from "../features/match/components/CustomUpdateModal";
import NextInningsSetupModal from "../features/match/components/NextInningsSetupModal";
import WinnerSelectionModal from "../features/match/components/WinnerSelectionModal";
import { saveManualMatchSync } from "../features/match/manualSync";
import { ballsToOversLabel } from "../features/match/overs";
import {
  fetchMatchDetails,
  fetchSession,
  fetchTeamPlayers,
  matchQueryKeys,
} from "../features/match/queries";
import { useMatchRealtime } from "../features/match/useMatchRealtime";

function formatOvers(totalBalls) {
  return ballsToOversLabel(totalBalls);
}

function buildTeamScoreMap(innings = []) {
  return innings.reduce((acc, inning) => {
    if (!inning?.batting_team_id) return acc;
    acc[String(inning.batting_team_id)] = inning;
    return acc;
  }, {});
}

function getTeamScoreSummary(team, scoreMap) {
  if (!team?.id) {
    return {
      runs: 0,
      wickets: 0,
      balls: 0,
      overs: "0.0",
      inningsId: null,
      hasScore: false,
    };
  }

  const inning = scoreMap[String(team.id)] ?? null;
  const balls = Number(inning?.balls ?? 0);
  return {
    runs: Number(inning?.runs ?? 0),
    wickets: Number(inning?.wickets ?? 0),
    balls,
    overs: formatOvers(balls),
    inningsId: inning?.id ?? null,
    hasScore: Boolean(inning),
  };
}

function TeamLogo({ team, className = "h-16 w-16 sm:h-20 sm:w-20" }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-lg ${className}`}
    >
      {team?.logo ? (
        <img
          src={team.logo}
          alt={`${team.name} logo`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-black text-slate-400">
          {String(team?.name ?? "T").slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function TeamName({ children, className = "" }) {
  return (
    <p
      className={`min-h-[3rem] text-wrap break-words text-balance font-semibold leading-tight ${className}`}
    >
      {children}
    </p>
  );
}

function StatusPill({ status }) {
  const meta = {
    upcoming: "bg-slate-100 text-slate-700 ring-slate-200",
    live: "bg-rose-50 text-rose-700 ring-rose-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  }[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ring-1 ring-inset ${meta}`}
    >
      {status === "live" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
      ) : null}
      {status}
    </span>
  );
}

function InfoChip({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${tones[tone] ?? tones.slate}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function UpcomingMatchView({ match, team1, team2 }) {
  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(1,69,242,0.14),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(233,240,255,0.8))] px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status="upcoming" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Match Preview
          </p>
        </div>

        <div className="mt-6 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <TeamLogo team={team1} className="h-24 w-24 sm:h-32 sm:w-32" />
            <TeamName className="mt-4 max-w-[14rem] text-lg sm:max-w-[16rem] sm:text-2xl">
              {team1?.name ?? "Team 1"}
            </TeamName>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-blue-100 bg-white text-3xl font-black tracking-[0.3em] text-blue-700 shadow-lg sm:h-28 sm:w-28 sm:text-4xl">
              VS
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <TeamLogo team={team2} className="h-24 w-24 sm:h-32 sm:w-32" />
            <TeamName className="mt-4 max-w-[14rem] text-lg sm:max-w-[16rem] sm:text-2xl">
              {team2?.name ?? "Team 2"}
            </TeamName>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoChip label="Status" value="Upcoming match" tone="blue" />
          <InfoChip
            label="Format"
            value={match?.format ?? "Tournament fixture"}
            tone="slate"
          />
          <InfoChip
            label="Venue"
            value={match?.venue ?? "Match center"}
            tone="emerald"
          />
        </div>
      </div>
    </section>
  );
}

function LiveMatchView({
  battingTeam,
  bowlingTeam,
  battingSummary,
  bowlingSummary,
  strikerName,
  nonStrikerName,
  currentBowlerName,
  targetText,
  runRateText,
}) {
  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.18),_transparent_35%),linear-gradient(135deg,_#fffdfd,_#f8fbff)] px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill status="live" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Stadium scoreboard
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:items-stretch">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <TeamLogo team={battingTeam} className="h-16 w-16 sm:h-20 sm:w-20" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-600">
                    Batting now
                  </p>
                  <TeamName className="mt-1 max-w-[14rem] text-lg text-slate-900 sm:max-w-[20rem] sm:text-3xl">
                    {battingTeam?.name ?? "Batting team"}
                  </TeamName>
                </div>
              </div>
              {targetText ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 shadow-sm">
                  {targetText}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-2">
              <div className="text-6xl font-black tracking-tighter text-slate-950 sm:text-[7rem]">
                {battingSummary.runs}
                <span className="text-3xl text-slate-400 sm:text-[4rem]">
                  /{battingSummary.wickets}
                </span>
              </div>
              <div className="pb-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-base">
                Overs {battingSummary.overs}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoChip label="Run rate" value={runRateText} tone="rose" />
              <InfoChip
                label="Bowling side"
                value={bowlingTeam?.name ?? "Opposition"}
                tone="slate"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Scoreboard
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    Match overview
                  </p>
                </div>
                <TeamLogo team={bowlingTeam} className="h-12 w-12" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">
                    Batting team
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-950">
                    {battingSummary.runs}/{battingSummary.wickets}
                  </p>
                  <p className="text-sm font-semibold text-rose-700">
                    Overs {battingSummary.overs}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Other team
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900">
                    {bowlingSummary.runs}/{bowlingSummary.wickets}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    Overs {bowlingSummary.overs}
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </section>
  );
}

function CompletedMatchView({
  team1,
  team2,
  team1Summary,
  team2Summary,
  winnerTeamId,
  winnerText,
}) {
  const team1Won = String(team1?.id) === String(winnerTeamId);
  const team2Won = String(team2?.id) === String(winnerTeamId);

  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff,_#f4fbf8)] px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill status="completed" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Final result
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Match complete
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {winnerText}
          </h2>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article
            className={`rounded-[2rem] border p-4 shadow-sm sm:p-6 ${
              team1Won
                ? "border-emerald-300 bg-emerald-50 shadow-[0_16px_40px_rgba(16,185,129,0.18)]"
                : "border-slate-200 bg-white/85 opacity-90"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <TeamLogo team={team1} className="h-16 w-16 sm:h-20 sm:w-20" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TeamName className="max-w-[14rem] text-lg text-slate-900 sm:max-w-[18rem] sm:text-2xl">
                      {team1?.name ?? "Team 1"}
                    </TeamName>
                    {team1Won ? (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Winner
                      </span>
                    ) : null}
                  </div>
                  {team1Won ? (
                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                      Trophy team
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-5xl font-black tracking-tighter text-slate-950 sm:text-6xl">
                {team1Summary.runs}
                <span className="text-2xl text-slate-400 sm:text-4xl">
                  /{team1Summary.wickets}
                </span>
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Overs {team1Summary.overs}
              </p>
            </div>
          </article>

          <article
            className={`rounded-[2rem] border p-4 shadow-sm sm:p-6 ${
              team2Won
                ? "border-emerald-300 bg-emerald-50 shadow-[0_16px_40px_rgba(16,185,129,0.18)]"
                : "border-slate-200 bg-white/85 opacity-90"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <TeamLogo team={team2} className="h-16 w-16 sm:h-20 sm:w-20" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TeamName className="max-w-[14rem] text-lg text-slate-900 sm:max-w-[18rem] sm:text-2xl">
                      {team2?.name ?? "Team 2"}
                    </TeamName>
                    {team2Won ? (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Winner
                      </span>
                    ) : null}
                  </div>
                  {team2Won ? (
                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                      Trophy team
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-5xl font-black tracking-tighter text-slate-950 sm:text-6xl">
                {team2Summary.runs}
                <span className="text-2xl text-slate-400 sm:text-4xl">
                  /{team2Summary.wickets}
                </span>
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Overs {team2Summary.overs}
              </p>
            </div>
          </article>
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
  const [showWinnerSelectionModal, setShowWinnerSelectionModal] =
    useState(false);
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
    winnerId: null,
    status: "upcoming",
  });

  const matchQuery = useQuery({
    queryKey: matchQueryKeys.detail(matchId),
    queryFn: () => fetchMatchDetails(matchId),
    enabled: Boolean(matchId),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
      winnerId: matchQuery.data.match.winner_id ?? null,
      status: matchQuery.data.match.status,
    }));
  }, [matchQuery.data]);

  const base = matchQuery.data;
  const isAdminUser = useMemo(() => {
    const role =
      session?.user?.app_metadata?.role ?? session?.user?.user_metadata?.role;
    if (!role) return Boolean(session);
    return String(role).toLowerCase() === "admin";
  }, [session]);
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
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const team2PlayersQuery = useQuery({
    queryKey: matchQueryKeys.teamPlayers(base?.match?.team2_id),
    queryFn: () => fetchTeamPlayers(base?.match?.team2_id),
    enabled: Boolean(base?.match?.team2_id),
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
            winner_id:
              nextLive.winnerId ?? nextLive.winner_id ?? prev.match.winner_id ?? null,
          },
        };
      });
    },
    [matchId, queryClient],
  );

  const syncScorecardsCache = useCallback(
    ({ inningsId, batterRows, bowlerRows }) => {
      if (!inningsId) return;
      queryClient.setQueryData(matchQueryKeys.detail(matchId), (prev) => {
        if (!prev) return prev;
        const inningsKey = String(inningsId);
        const nameById = new Map(
          [
            ...(team1PlayersQuery.data ?? []),
            ...(team2PlayersQuery.data ?? []),
          ].map((player) => [String(player.id), player.name ?? "Unknown"]),
        );
        const normalizedBatters = batterRows
          ? batterRows.map((row) => ({
              id: `manual-batter-${inningsKey}-${row.playerId}`,
              inningsId,
              playerId: row.playerId,
              role: "batter",
              name: nameById.get(String(row.playerId)) ?? "Unknown",
              runs: row.runs,
              balls: row.balls,
              fours: row.fours,
              sixes: row.sixes,
              isOut: row.isOut,
              strikeRate: row.strikeRate,
            }))
          : null;
        const normalizedBowlers = bowlerRows
          ? bowlerRows.map((row) => ({
              id: `manual-bowler-${inningsKey}-${row.playerId}`,
              inningsId,
              playerId: row.playerId,
              role: "bowler",
              name: nameById.get(String(row.playerId)) ?? "Unknown",
              ballsBowled: row.ballsBowled,
              overs: row.overs,
              runs: row.runs,
              wickets: row.wickets,
              economy: row.economy,
            }))
          : null;

        return {
          ...prev,
          scorecards: {
            batter: {
              ...prev.scorecards.batter,
              ...(normalizedBatters ? { [inningsKey]: normalizedBatters } : {}),
            },
            bowler: {
              ...prev.scorecards.bowler,
              ...(normalizedBowlers ? { [inningsKey]: normalizedBowlers } : {}),
            },
          },
        };
      });
    },
    [matchId, queryClient, team1PlayersQuery.data, team2PlayersQuery.data],
  );

  const syncInningsCache = useCallback(
    ({ inningsId, inningsPatch }) => {
      if (!inningsId || !inningsPatch) return;
      queryClient.setQueryData(matchQueryKeys.detail(matchId), (prev) => {
        if (!prev) return prev;
        const updatedAll = prev.innings.all.map((inning) =>
          String(inning.id) === String(inningsId)
            ? { ...inning, ...inningsPatch }
            : inning,
        );
        return {
          ...prev,
          innings: {
            ...prev.innings,
            all: updatedAll,
            first:
              String(prev.innings.first?.id) === String(inningsId)
                ? { ...prev.innings.first, ...inningsPatch }
                : prev.innings.first,
            second:
              String(prev.innings.second?.id) === String(inningsId)
                ? { ...prev.innings.second, ...inningsPatch }
                : prev.innings.second,
            latest:
              String(prev.innings.latest?.id) === String(inningsId)
                ? { ...prev.innings.latest, ...inningsPatch }
                : prev.innings.latest,
          },
        };
      });
    },
    [matchId, queryClient],
  );

  const handleLiveScoreEvent = useCallback(
    (event) =>
      setLiveState((prev) => {
        const next = { ...prev, ...event };
        syncCache(next);
        return next;
      }),
    [syncCache],
  );

  useMatchRealtime({
    matchId,
    onLiveScoreEvent: handleLiveScoreEvent,
  });

  const applyScorecardDeltas = useCallback(
    ({ inningsId, batterDelta, bowlerDelta }) => {
      if (!inningsId) return { batter: null, bowler: null };

      const nameById = new Map(
        [
          ...(team1PlayersQuery.data ?? []),
          ...(team2PlayersQuery.data ?? []),
        ].map((player) => [String(player.id), player.name ?? "Unknown"]),
      );

      let resolved = { batter: null, bowler: null };
      queryClient.setQueryData(matchQueryKeys.detail(matchId), (prev) => {
        if (!prev) return prev;

        const inningsKey = String(inningsId);
        const nextBatterRows = [
          ...(prev.scorecards?.batter?.[inningsKey] ?? []),
        ];
        const nextBowlerRows = [
          ...(prev.scorecards?.bowler?.[inningsKey] ?? []),
        ];

        if (
          batterDelta?.playerId &&
          (batterDelta.forceRow ||
            batterDelta.runs ||
            batterDelta.balls ||
            batterDelta.setOut != null)
        ) {
          const playerId = String(batterDelta.playerId);
          const index = nextBatterRows.findIndex(
            (row) => String(row.playerId) === playerId,
          );
          const existing =
            index >= 0
              ? nextBatterRows[index]
              : {
                  id: `local-batter-${inningsKey}-${playerId}`,
                  inningsId,
                  playerId: batterDelta.playerId,
                  role: "batter",
                  name: nameById.get(playerId) ?? "Unknown",
                  runs: 0,
                  balls: 0,
                  fours: 0,
                  sixes: 0,
                  isOut: false,
                  strikeRate: 0,
                };
          const runs = Math.max(
            0,
            Number(existing.runs || 0) + Number(batterDelta.runs || 0),
          );
          const balls = Math.max(
            0,
            Number(existing.balls || 0) + Number(batterDelta.balls || 0),
          );
          const updated = {
            ...existing,
            runs,
            balls,
            isOut:
              batterDelta.setOut == null
                ? Boolean(existing.isOut)
                : Boolean(batterDelta.setOut),
            strikeRate:
              balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0,
          };
          if (index >= 0) nextBatterRows[index] = updated;
          else nextBatterRows.push(updated);
          resolved.batter = updated;
        }

        if (
          bowlerDelta?.playerId &&
          (bowlerDelta.forceRow ||
            bowlerDelta.runsConceded ||
            bowlerDelta.ballsBowled ||
            bowlerDelta.wickets)
        ) {
          const playerId = String(bowlerDelta.playerId);
          const index = nextBowlerRows.findIndex(
            (row) => String(row.playerId) === playerId,
          );
          const existing =
            index >= 0
              ? nextBowlerRows[index]
              : {
                  id: `local-bowler-${inningsKey}-${playerId}`,
                  inningsId,
                  playerId: bowlerDelta.playerId,
                  role: "bowler",
                  name: nameById.get(playerId) ?? "Unknown",
                  ballsBowled: 0,
                  overs: "0.0",
                  runs: 0,
                  wickets: 0,
                  economy: 0,
                };
          const ballsBowled = Math.max(
            0,
            Number(existing.ballsBowled || 0) +
              Number(bowlerDelta.ballsBowled || 0),
          );
          const runs = Math.max(
            0,
            Number(existing.runs || 0) + Number(bowlerDelta.runsConceded || 0),
          );
          const wickets = Math.max(
            0,
            Number(existing.wickets || 0) + Number(bowlerDelta.wickets || 0),
          );
          const updated = {
            ...existing,
            ballsBowled,
            runs,
            wickets,
            overs: ballsToOversLabel(ballsBowled),
            economy:
              ballsBowled > 0
                ? Number(((runs * 6) / ballsBowled).toFixed(2))
                : 0,
          };
          if (index >= 0) nextBowlerRows[index] = updated;
          else nextBowlerRows.push(updated);
          resolved.bowler = updated;
        }

        return {
          ...prev,
          scorecards: {
            ...prev.scorecards,
            batter: {
              ...prev.scorecards.batter,
              [inningsKey]: nextBatterRows,
            },
            bowler: {
              ...prev.scorecards.bowler,
              [inningsKey]: nextBowlerRows,
            },
          },
        };
      });

      return resolved;
    },
    [matchId, queryClient, team1PlayersQuery.data, team2PlayersQuery.data],
  );

  const upsertPlayerStatsBatch = useCallback(
    async ({ inningsId, batterRow, bowlerRow }) => {
      if (!inningsId) return;
      const rows = [];
      if (batterRow?.playerId) {
        rows.push({
          match_id: matchId,
          innings_id: inningsId,
          player_id: batterRow.playerId,
          role: "batter",
          runs: Math.max(0, Number(batterRow.runs || 0)),
          balls: Math.max(0, Number(batterRow.balls || 0)),
          is_out: Boolean(batterRow.isOut),
        });
      }
      if (bowlerRow?.playerId) {
        rows.push({
          match_id: matchId,
          innings_id: inningsId,
          player_id: bowlerRow.playerId,
          role: "bowler",
          runs_conceded: Math.max(0, Number(bowlerRow.runs || 0)),
          balls_bowled: Math.max(0, Number(bowlerRow.ballsBowled || 0)),
          wickets: Math.max(0, Number(bowlerRow.wickets || 0)),
        });
      }
      if (!rows.length) return;
      const { error } = await supabase.from("player_stats").upsert(rows, {
        onConflict: "match_id,innings_id,player_id,role",
      });
      if (error) throw error;
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
      } catch {
        setError("Failed to start match.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [base, matchId, queryClient, syncCache],
  );

  const scoreBall = useCallback(
    async ({ runs, extraType = null, isWicket = false, shouldSwapStrike = false }) => {
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

        if (extraType) {
          if (shouldSwapStrike) {
            strikerId = liveState.nonStrikerId;
            nonStrikerId = liveState.strikerId;
          }
        } else if (!isWicket && runs % 2 === 1) {
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

        const updatedRows = applyScorecardDeltas({
          inningsId: liveState.inningsId,
          batterDelta: {
            playerId: liveState.strikerId,
            runs: batterRuns,
            balls: batterBalls,
            setOut: isWicket ? true : undefined,
            forceRow: Boolean(isWicket || batterRuns || batterBalls),
          },
          bowlerDelta: {
            playerId: liveState.currentBowlerId,
            runsConceded: bowlerRuns,
            ballsBowled: bowlerBalls,
            wickets: isWicket ? 1 : 0,
            forceRow: Boolean(bowlerRuns || bowlerBalls || isWicket),
          },
        });
        await upsertPlayerStatsBatch({
          inningsId: liveState.inningsId,
          batterRow: updatedRows.batter,
          bowlerRow: updatedRows.bowler,
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
      } catch {
        setError("Scoring update failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      applyScorecardDeltas,
      liveState,
      matchId,
      syncCache,
      upsertPlayerStatsBatch,
    ],
  );

  const handleUndo = useCallback(async () => {
    if (!liveState.inningsId) return;
    setIsSubmitting(true);
    try {
      const { data: lastBall } = await supabase
        .from("balls")
        .select("id, runs, extra_type, is_wicket, batsman_id, bowler_id")
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

      const lastRuns = Number(lastBall.runs || 0);
      const batterRuns =
        !lastBall.extra_type || lastBall.extra_type === "NB" ? lastRuns : 0;
      const batterBalls = legal ? 1 : 0;
      const bowlerRuns =
        lastBall.extra_type === "LB" ||
        lastBall.extra_type === "B" ||
        lastBall.extra_type === "P"
          ? 0
          : lastRuns;
      const bowlerBalls = legal ? 1 : 0;

      await supabase.from("balls").delete().eq("id", lastBall.id);
      await supabase
        .from("innings")
        .update({ runs: next.runs, wickets: next.wickets, balls: next.balls })
        .eq("id", liveState.inningsId);

      const updatedRows = applyScorecardDeltas({
        inningsId: liveState.inningsId,
        batterDelta: {
          playerId: lastBall.batsman_id,
          runs: -batterRuns,
          balls: -batterBalls,
          setOut: lastBall.is_wicket ? false : undefined,
          forceRow: Boolean(
            lastBall.batsman_id &&
            (batterRuns > 0 || batterBalls > 0 || lastBall.is_wicket),
          ),
        },
        bowlerDelta: {
          playerId: lastBall.bowler_id,
          runsConceded: -bowlerRuns,
          ballsBowled: -bowlerBalls,
          wickets: lastBall.is_wicket ? -1 : 0,
          forceRow: Boolean(lastBall.bowler_id),
        },
      });
      await upsertPlayerStatsBatch({
        inningsId: liveState.inningsId,
        batterRow: updatedRows.batter,
        bowlerRow: updatedRows.bowler,
      });

      setLiveState(next);
      syncCache(next);
    } catch {
      setError("Undo failed.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    applyScorecardDeltas,
    liveState,
    matchId,
    syncCache,
    upsertPlayerStatsBatch,
  ]);

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
      if (
        form?.strikerId &&
        form?.nonStrikerId &&
        String(form.strikerId) === String(form.nonStrikerId)
      ) {
        setError("Striker and non-striker cannot be the same.");
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await saveManualMatchSync({
          matchId,
          inningsId: liveState.inningsId,
          summary: form.summary,
          batters: form.batters,
          bowlers: form.bowlers,
          strikerId: form.strikerId,
          nonStrikerId: form.nonStrikerId,
          currentBowlerId: form.currentBowlerId,
        });
        const next = {
          ...liveState,
          ...result.live,
        };
        setLiveState(next);
        syncCache(next);
        syncInningsCache({
          inningsId: liveState.inningsId,
          inningsPatch: result.inningsPatch,
        });
        syncScorecardsCache({
          inningsId: liveState.inningsId,
          batterRows: result.normalizedScorecards.batter,
          bowlerRows: result.normalizedScorecards.bowler,
        });
        setShowCustomUpdate(false);
      } catch {
        setError("Custom update failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, syncCache, syncInningsCache, syncScorecardsCache],
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
    } catch {
      setError("Unable to complete innings.");
    } finally {
      setIsSubmitting(false);
    }
  }, [base, liveState, matchId, syncCache]);

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
      } catch {
        setError("Unable to start next innings with selected players.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, pendingNextInnings, queryClient, syncCache],
  );

  const handleOpenCompleteMatch = useCallback(() => {
    if (!liveState.inningsId) return;
    setShowWinnerSelectionModal(true);
  }, [liveState.inningsId]);

  const handleCompleteMatch = useCallback(
    async (winnerTeamId) => {
      if (!liveState.inningsId || !winnerTeamId) return;
      setIsSubmitting(true);
      setError("");
      try {
        await supabase
          .from("innings")
          .update({ status: "completed" })
          .eq("id", liveState.inningsId);
        await supabase
          .from("matches")
          .update({
            status: "completed",
            current_innings: liveState.inningsId,
            winner_id: winnerTeamId,
          })
          .eq("id", matchId);
        const next = {
          ...liveState,
          status: "completed",
          winnerId: winnerTeamId,
        };
        setLiveState(next);
        syncCache(next);
        setShowWinnerSelectionModal(false);
        queryClient.invalidateQueries({
          queryKey: matchQueryKeys.detail(matchId),
          refetchType: "inactive",
        });
      } catch {
        setError("Unable to complete match.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [liveState, matchId, queryClient, syncCache],
  );

  const matchStatus = liveState.status ?? base?.match?.status ?? "upcoming";
  const scoreMap = useMemo(
    () => buildTeamScoreMap(base?.innings?.all ?? []),
    [base?.innings?.all],
  );
  const team1Summary = getTeamScoreSummary(base?.match?.team1, scoreMap);
  const team2Summary = getTeamScoreSummary(base?.match?.team2, scoreMap);
  const currentBattingTeam =
    teams.find((t) => String(t?.id) === String(battingTeamId)) ||
    base?.match?.team1;
  const currentBowlingTeam =
    teams.find((t) => String(t?.id) === String(bowlingTeamId)) ||
    base?.match?.team2;
  const battingSummary = getTeamScoreSummary(currentBattingTeam, scoreMap);
  const bowlingSummary = getTeamScoreSummary(currentBowlingTeam, scoreMap);
  const winnerTeamId =
    base?.match?.winner_id ?? liveState.winnerId ?? null;
  const winnerTeam =
    teams.find((team) => String(team?.id) === String(winnerTeamId)) ?? null;
  const winnerText = useMemo(() => {
    if (!winnerTeam) return "Match complete";

    if (base?.innings?.first && base?.innings?.second) {
      const firstTeamId = String(base.innings.first.batting_team_id);
      const secondTeamId = String(base.innings.second.batting_team_id);
      if (String(winnerTeam.id) === firstTeamId) {
        const margin = Math.max(
          1,
          Number(base.innings.first.runs ?? 0) -
            Number(base.innings.second.runs ?? 0),
        );
        return `${winnerTeam.name} won by ${margin} runs`;
      }
      if (String(winnerTeam.id) === secondTeamId) {
        const wicketsRemaining = Math.max(
          1,
          10 - Number(base.innings.second.wickets ?? 0),
        );
        return `${winnerTeam.name} won by ${wicketsRemaining} wickets`;
      }
    }

    const otherTeam =
      String(winnerTeam.id) === String(base?.match?.team1?.id)
        ? base?.match?.team2
        : base?.match?.team1;
    const winnerRuns = Number(scoreMap[String(winnerTeam.id)]?.runs ?? 0);
    const otherRuns = Number(scoreMap[String(otherTeam?.id)]?.runs ?? 0);
    if (winnerRuns !== otherRuns) {
      const margin = Math.max(1, Math.abs(winnerRuns - otherRuns));
      return `${winnerTeam.name} won by ${margin} runs`;
    }
    return `${winnerTeam.name} won the match`;
  }, [base, scoreMap, winnerTeam]);
  const targetText =
    matchStatus === "live" &&
    base?.innings?.first &&
    String(liveState.inningsId) === String(base?.innings?.second?.id)
      ? `Target ${Number(base.innings.first.runs || 0) + 1}`
      : "";
  const runRateText =
    battingSummary.balls > 0
      ? `${((battingSummary.runs * 6) / battingSummary.balls).toFixed(2)}`
      : "0.00";

  const batterFor = (inningsId) =>
    inningsId
      ? (base?.scorecards?.batter?.[String(inningsId)] ?? []).filter(
          (row) => Number(row?.balls) > 0,
        )
      : [];
  const bowlerFor = (inningsId) =>
    inningsId
      ? (base?.scorecards?.bowler?.[String(inningsId)] ?? []).filter(
          (row) => Number(row?.ballsBowled) > 0,
        )
      : [];
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
  const playerNameById = useMemo(
    () =>
      new Map(
        [
          ...(team1PlayersQuery.data ?? []),
          ...(team2PlayersQuery.data ?? []),
        ].map((player) => [String(player.id), player.name ?? "Unknown"]),
      ),
    [team1PlayersQuery.data, team2PlayersQuery.data],
  );
  const strikerName = liveState.strikerId
    ? (playerNameById.get(String(liveState.strikerId)) ?? "Unknown")
    : "Unassigned";
  const nonStrikerName = liveState.nonStrikerId
    ? (playerNameById.get(String(liveState.nonStrikerId)) ?? "Unknown")
    : "Unassigned";
  const currentBowlerName = liveState.currentBowlerId
    ? (playerNameById.get(String(liveState.currentBowlerId)) ?? "Unknown")
    : "Unassigned";

  return (
    <div className="app-shell">
      <NavBar />
      <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          {base ? (
            <>
              {matchStatus === "upcoming" ? (
                <UpcomingMatchView
                  team1={base.match.team1}
                  team2={base.match.team2}
                />
              ) : null}

              {matchStatus === "live" ? (
                <LiveMatchView
                  battingTeam={currentBattingTeam}
                  bowlingTeam={currentBowlingTeam}
                  battingSummary={battingSummary}
                  bowlingSummary={bowlingSummary}
                  strikerName={strikerName}
                  nonStrikerName={nonStrikerName}
                  currentBowlerName={currentBowlerName}
                  targetText={targetText}
                  runRateText={runRateText}
                />
              ) : null}

              {matchStatus === "completed" ? (
                <CompletedMatchView
                  team1={base.match.team1}
                  team2={base.match.team2}
                  team1Summary={team1Summary}
                  team2Summary={team2Summary}
                  winnerTeamId={winnerTeamId}
                  winnerText={winnerText}
                />
              ) : null}

              {!isSessionLoading && isAdminUser ? (
                <>
                  {matchStatus === "upcoming" ? (
                    <section className="surface-card overflow-hidden border border-blue-100 bg-white p-0">
                      <div className="grid gap-4 bg-[linear-gradient(135deg,_rgba(1,69,242,0.06),_rgba(255,255,255,1))] p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="eyebrow">Admin Controls</p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-900">
                              Ready to start the match
                            </h3>
                          </div>
                          <StatusPill status="upcoming" />
                        </div>
                        <button
                          className="h-16 w-full rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-sm disabled:opacity-50"
                          disabled={isSubmitting}
                          onClick={() => {
                            team1PlayersQuery.refetch();
                            team2PlayersQuery.refetch();
                            setShowStartModal(true);
                          }}
                        >
                          Start Match
                        </button>
                      </div>
                    </section>
                  ) : (
                    <AdminPanel
                      disabled={!liveState.inningsId}
                      isSubmitting={isSubmitting}
                      status={matchStatus}
                      canCustomUpdate={isAdminUser}
                      onRun={(runs) => scoreBall({ runs })}
                      onExtra={(type) => {
                        setPendingExtraType(type);
                        setShowExtrasModal(true);
                      }}
                      onWicket={() => scoreBall({ runs: 0, isWicket: true })}
                      onUndo={handleUndo}
                      onCustomUpdate={() => setShowCustomUpdate(true)}
                      onCompleteInnings={handleCompleteInnings}
                      onCompleteMatch={handleOpenCompleteMatch}
                    />
                  )}
                </>
              ) : null}

              {error ? (
                <section className="feedback-panel border-rose-200 bg-white">
                  <p className="text-sm font-medium text-rose-600">{error}</p>
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
                onSelect={({ runs, shouldSwapStrike }) => {
                  setShowExtrasModal(false);
                  scoreBall({
                    runs,
                    extraType: pendingExtraType,
                    shouldSwapStrike,
                  });
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
                battingPlayers={battingPlayers}
                bowlingPlayers={bowlingPlayers}
                batterRows={batterFor(liveState.inningsId)}
                bowlerRows={bowlerFor(liveState.inningsId)}
                onClose={() => setShowCustomUpdate(false)}
                onConfirm={handleCustomUpdate}
                isSubmitting={isSubmitting}
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
              <WinnerSelectionModal
                open={showWinnerSelectionModal}
                teams={teams}
                onClose={() => setShowWinnerSelectionModal(false)}
                onConfirm={handleCompleteMatch}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Match;
