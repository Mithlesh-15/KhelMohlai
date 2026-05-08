import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTopPlayerStats, statsQueryKeys } from "../features/stats/queries";

function initialsFromName(name) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
}

function PlayerStatItem({
  rank,
  playerName,
  teamName,
  primaryValue,
  primaryLabel,
  matchesPlayed,
  secondaryLabel,
  secondaryValue,
}) {
  return (
    <article
      className="flex items-center justify-between gap-4 rounded-3xl border px-4 py-4 shadow-sm sm:px-5"
      style={{
        background:
          rank === 1
            ? "linear-gradient(135deg, rgba(232, 240, 255, 0.78), rgba(255, 255, 255, 0.95))"
            : "rgba(255, 255, 255, 0.9)",
        borderColor:
          rank === 1
            ? "rgba(191, 210, 255, 0.95)"
            : "rgba(217, 226, 236, 0.95)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm"
          style={{
            backgroundColor:
              rank <= 3
                ? "rgba(1, 69, 242, 0.14)"
                : "rgba(226, 232, 240, 0.75)",
            color: rank <= 3 ? "var(--color-primary)" : "var(--text-primary)",
          }}
        >
          #{rank}
        </span>

        <div
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold"
          style={{
            backgroundColor: "rgba(232, 240, 255, 0.65)",
            borderColor: "rgba(191, 210, 255, 0.9)",
            color: "var(--color-primary)",
          }}
          aria-hidden="true"
        >
          {initialsFromName(playerName)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">
            {playerName}
          </p>
          <p
            className="truncate text-xs sm:text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {teamName}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className="text-xs sm:text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Matches:{" "}
          <span className="font-semibold tabular-nums">{matchesPlayed}</span>
        </p>
        <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">
          {primaryLabel}: {primaryValue}
        </p>
        {secondaryValue != null ? (
          <p
            className="mt-0.5 text-xs font-medium tabular-nums sm:text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {secondaryLabel}: {secondaryValue}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function StatCardSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center justify-between rounded-3xl border px-4 py-4 sm:px-5"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            borderColor: "rgba(217, 226, 236, 0.95)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full"
              style={{ backgroundColor: "var(--skeleton)" }}
            />
            <div
              className="h-10 w-10 rounded-2xl"
              style={{ backgroundColor: "var(--skeleton)" }}
            />
            <div className="space-y-2">
              <div
                className="h-4 w-24 rounded-full"
                style={{ backgroundColor: "var(--skeleton)" }}
              />
              <div
                className="h-3 w-20 rounded-full"
                style={{ backgroundColor: "var(--skeleton)" }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="ml-auto h-3 w-16 rounded-full"
              style={{ backgroundColor: "var(--skeleton)" }}
            />
            <div
              className="ml-auto h-4 w-20 rounded-full"
              style={{ backgroundColor: "var(--skeleton)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatListCard({
  title,
  players,
  valueKey,
  valueLabel,
  optionalMetricKey,
  optionalMetricLabel,
  emptyLabel,
}) {
  return (
    <section
      className="surface-card h-full p-4 sm:p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94))",
      }}
    >
      <header>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        
      </header>

      {players.length === 0 ? (
        <div
          className="mt-4 rounded-3xl border px-4 py-5 text-sm"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "var(--border-soft)",
            color: "var(--text-secondary)",
          }}
        >
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {players.map((player, index) => (
            <PlayerStatItem
              key={`${valueKey}-${player.playerId}`}
              rank={index + 1}
              playerName={player.playerName}
              teamName={player.teamName}
              matchesPlayed={player.matchesPlayed}
              primaryLabel={valueLabel}
              primaryValue={player[valueKey]}
              secondaryLabel={optionalMetricLabel}
              secondaryValue={player[optionalMetricKey]}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: statsQueryKeys.overview,
    queryFn: fetchTopPlayerStats,
    staleTime: 3 * 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 3 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const runScorers = data?.topRunScorers ?? [];
  const wicketTakers = data?.topWicketTakers ?? [];
  const hasNoData =
    !isLoading &&
    !isError &&
    runScorers.length === 0 &&
    wicketTakers.length === 0;

  return (
    <main className="px-4 pb-28 pt-3 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="px-1">
          <p className="eyebrow">Performance Insights</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Cricket Stats
          </h1>
        </div>

        {isError ? (
          <section
            className="feedback-panel"
            style={{
              backgroundColor: "#fffaf9",
              borderColor: "rgba(248, 113, 113, 0.24)",
            }}
          >
            <h2 className="text-base font-semibold">
              Unable to load player stats
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {error?.message || "Please try again in a moment."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 rounded-full border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "rgba(1, 69, 242, 0.28)",
                color: "var(--color-primary)",
                backgroundColor: "rgba(232, 240, 255, 0.56)",
              }}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </button>
          </section>
        ) : null}

        {hasNoData ? (
          <section
            className="feedback-panel bg-white"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <h2 className="text-base font-semibold">
              No player stats available
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Stats will appear once match scorecards are recorded.
            </p>
          </section>
        ) : null}

        {!isError && !hasNoData ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {isLoading ? (
              <>
                <section className="surface-card p-4 sm:p-5">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Highest Run Scorers
                  </h2>
                  <div className="mt-4">
                    <StatCardSkeleton />
                  </div>
                </section>

                <section className="surface-card p-4 sm:p-5">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Highest Wicket Takers
                  </h2>
                  <div className="mt-4">
                    <StatCardSkeleton />
                  </div>
                </section>
              </>
            ) : (
              <>
                <StatListCard
                  title="Highest Run Scorers"
                  players={runScorers}
                  valueKey="runs"
                  valueLabel="Runs"
                  optionalMetricKey="strikeRate"
                  optionalMetricLabel="SR"
                  emptyLabel="No batter data yet."
                />
                <StatListCard
                  title="Highest Wicket Takers"
                  players={wicketTakers}
                  valueKey="wickets"
                  valueLabel="Wickets"
                  optionalMetricKey="economy"
                  optionalMetricLabel="Eco"
                  emptyLabel="No bowler data yet."
                />
              </>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default StatsPage;
