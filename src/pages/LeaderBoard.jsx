import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLeaderboardTable,
  leaderboardQueryKeys,
} from "../features/leaderboard/queries";

function LoadingRow() {
  return (
    <div
      className="grid min-w-155 grid-cols-[44px_minmax(170px,1.8fr)_52px_52px_52px_60px_82px] animate-pulse items-center gap-2 rounded-[1.2rem] border px-3 py-3 sm:min-w-175 sm:grid-cols-[52px_minmax(220px,1.8fr)_62px_62px_62px_72px_100px] sm:gap-3 sm:px-4 sm:py-4"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.72)",
        borderColor: "rgba(217, 226, 236, 0.85)",
      }}
    >
      <div
        className="h-7 w-7 rounded-full sm:h-8 sm:w-8"
        style={{ backgroundColor: "var(--skeleton)" }}
      />
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="h-10 w-10 rounded-2xl sm:h-11 sm:w-11"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
        <div
          className="h-4 w-28 rounded-full"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
      </div>
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="ml-auto h-4 w-8 rounded-full"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
      ))}
    </div>
  );
}

function LeaderBoard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: leaderboardQueryKeys.table,
    queryFn: fetchLeaderboardTable,
    staleTime: 30 * 60 * 1000,
    gcTime: 5 * 24 * 60 * 60 * 1000,
    retry: 2,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const teams = data ?? [];
  const errorMessage =
    error?.message ||
    "Unable to load the points table right now. Please try again shortly.";

  return (
    <main className="px-4 pb-28 pt-3 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="px-1">
          <p className="eyebrow">Tournament Standings</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Leaderboard
              </h1>
              <p
                className="mt-2 text-sm sm:text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                Team rankings sorted by points first, then net run rate.
              </p>
            </div>
            {!isLoading && !isError && teams.length > 0 ? (
              <div
                className="hidden rounded-full border px-4 py-2 text-sm font-medium sm:block"
                style={{
                  borderColor: "rgba(191, 210, 255, 0.9)",
                  backgroundColor: "rgba(232, 240, 255, 0.78)",
                  color: "var(--color-primary)",
                }}
              >
                {teams.length} Teams
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="surface-card flex min-h-[calc(100vh-12.5rem)] flex-col overflow-hidden p-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94))",
          }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-auto px-2 py-2 sm:px-3 sm:py-3">
            <div className="flex min-w-155 flex-col gap-2 sm:min-w-175 sm:gap-3">
              <div
                className="sticky top-0 z-10 grid grid-cols-[44px_minmax(170px,1.8fr)_52px_52px_52px_60px_82px] items-center gap-2 border-b px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] sm:grid-cols-[52px_minmax(220px,1.8fr)_62px_62px_62px_72px_100px] sm:gap-3 sm:px-4 sm:py-4 sm:text-xs"
                style={{
                  borderColor: "rgba(217, 226, 236, 0.95)",
                  color: "var(--text-secondary)",
                  backgroundColor: "rgba(248, 250, 252, 0.85)",
                }}
              >
                <span>Pos</span>
                <span>Team</span>
                <span className="text-right">P</span>
                <span className="text-right">W</span>
                <span className="text-right">L</span>
                <span className="text-right">Pts</span>
                <span className="text-right">NRR</span>
              </div>

              {isLoading ? (
                <>
                  <LoadingRow />
                  <LoadingRow />
                  <LoadingRow />
                  <LoadingRow />
                </>
              ) : null}

              {!isLoading && isError ? (
                <section
                  className="feedback-panel"
                  style={{
                    backgroundColor: "#fffaf9",
                    borderColor: "rgba(248, 113, 113, 0.24)",
                    color: "var(--text-primary)",
                  }}
                >
                  <h2 className="text-base font-semibold">
                    Something went wrong
                  </h2>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {errorMessage}
                  </p>
                </section>
              ) : null}

              {!isLoading && !isError && teams.length === 0 ? (
                <section
                  className="feedback-panel"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    borderColor: "var(--border-soft)",
                  }}
                >
                  <h2 className="text-base font-semibold">
                    No teams available
                  </h2>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Add teams to the tournament to see the points table here.
                  </p>
                </section>
              ) : null}

              {!isLoading && !isError
                ? teams.map((team) => (
                    <article
                      key={team.id}
                      className="grid min-w-155 grid-cols-[44px_minmax(170px,1.8fr)_52px_52px_52px_60px_82px] items-center gap-2 rounded-[1.2rem] border px-3 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:min-w-175 sm:grid-cols-[52px_minmax(220px,1.8fr)_62px_62px_62px_72px_100px] sm:gap-3 sm:px-4 sm:py-4"
                      style={{
                        background:
                          team.position <= 4
                            ? "linear-gradient(135deg, rgba(232, 240, 255, 0.9), rgba(255, 255, 255, 0.98))"
                            : "rgba(255, 255, 255, 0.86)",
                        borderColor:
                          team.position <= 4
                            ? "rgba(191, 210, 255, 0.95)"
                            : "rgba(217, 226, 236, 0.9)",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      <div className="flex items-center">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm"
                          style={{
                            backgroundColor:
                              team.position <= 4
                                ? "rgba(1, 69, 242, 0.12)"
                                : "rgba(226, 232, 240, 0.7)",
                            color:
                              team.position <= 4
                                ? "var(--color-primary)"
                                : "var(--text-primary)",
                          }}
                        >
                          {team.position}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <img
                          src={team.logo}
                          alt={`${team.name} logo`}
                          className="h-9 w-9 rounded-xl border object-cover sm:h-10 sm:w-10 sm:rounded-2xl"
                          style={{ borderColor: "rgba(191, 210, 255, 0.65)" }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold sm:text-sm">
                            {team.name}
                          </p>
                        </div>
                      </div>

                      <span className="text-right text-xs font-medium tabular-nums sm:text-sm">
                        {team.played}
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums sm:text-sm">
                        {team.wins}
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums sm:text-sm">
                        {team.losses}
                      </span>
                      <span className="text-right text-sm font-bold tabular-nums sm:text-sm">
                        {team.points}
                      </span>
                      <span className="text-right text-xs font-semibold tabular-nums sm:text-sm">
                        {team.netRunRate >= 0 ? "+" : "-"}
                        {team.netRunRate.toFixed(3)}
                      </span>
                    </article>
                  ))
                : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LeaderBoard;
