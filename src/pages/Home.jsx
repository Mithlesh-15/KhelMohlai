import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MatchCard from "../components/MatchCard";
import {
  fetchMatches,
  fetchTeams,
  filterMatchesByTab,
  homeQueryKeys,
  mapMatchesWithTeams,
} from "../features/home/queries";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

function LoadingCard() {
  return (
    <div className="surface-card animate-pulse">
      <div className="flex items-center justify-between gap-3">
        {[0, 1].map((item) => (
          <div key={item} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl"
              style={{ backgroundColor: "var(--skeleton)" }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="h-4 rounded-full"
                style={{ backgroundColor: "var(--skeleton)" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: "rgba(217, 226, 236, 0.9)" }}
      >
        <div
          className="h-4 w-32 rounded-full"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
        <div
          className="h-7 w-24 rounded-full"
          style={{ backgroundColor: "var(--skeleton)" }}
        />
      </div>
    </div>
  );
}

function Home() {
  const [activeTab, setActiveTab] = useState("today");

  const teamsQuery = useQuery({
    queryKey: homeQueryKeys.teams,
    queryFn: fetchTeams,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const matchesQuery = useQuery({
    queryKey: homeQueryKeys.matches,
    queryFn: fetchMatches,
    staleTime: 15 * 60 * 1000,
    gcTime: 2 * 24 * 60 * 60 * 1000,
    retry: 2,
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const mappedMatches = useMemo(
    () => mapMatchesWithTeams(matchesQuery.data ?? [], teamsQuery.data ?? []),
    [matchesQuery.data, teamsQuery.data],
  );
  const filteredMatches = useMemo(
    () => filterMatchesByTab(mappedMatches, activeTab),
    [mappedMatches, activeTab],
  );

  const isLoading = teamsQuery.isLoading || matchesQuery.isLoading;
  const isError = teamsQuery.isError || matchesQuery.isError;

  return (
    <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div className="surface-card p-2">
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-primary)"
                      : "#f8fafc",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
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
            <h2 className="text-base font-semibold">Something went wrong</h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Unable to load matches right now. Please try again shortly.
            </p>
          </section>
        ) : null}

        {!isLoading && !isError && filteredMatches.length === 0 ? (
          <section
            className="feedback-panel bg-white"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <h2 className="text-base font-semibold">No {activeTab} matches</h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Check back later for updated fixtures and results.
            </p>
          </section>
        ) : null}

        {!isLoading && !isError
          ? filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          : null}
      </div>
    </main>
  );
}

export default Home;
