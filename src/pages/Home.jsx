import React, { useEffect, useState } from 'react';
import MatchCard from '../components/MatchCard';
import { supabase } from '../utils/supabase';

const FALLBACK_TEAM = {
  name: 'TBD',
  logo: '',
};

function formatMatchStartTime(startTime) {
  if (!startTime) {
    return 'Time not announced';
  }

  const matchDate = new Date(startTime);

  if (Number.isNaN(matchDate.getTime())) {
    return 'Time not announced';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());

  let dayLabel = matchDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  if (matchDay.getTime() === today.getTime()) {
    dayLabel = 'Today';
  } else if (matchDay.getTime() === tomorrow.getTime()) {
    dayLabel = 'Tomorrow';
  }

  const timeLabel = matchDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dayLabel}, ${timeLabel}`;
}

function LoadingCard() {
  return (
    <div className="surface-card animate-pulse">
      <div className="flex items-center justify-between gap-3">
        {[0, 1].map((item) => (
          <div key={item} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl"
              style={{ backgroundColor: 'var(--skeleton)' }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="h-4 rounded-full"
                style={{ backgroundColor: 'var(--skeleton)' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: 'rgba(217, 226, 236, 0.9)' }}
      >
        <div
          className="h-4 w-32 rounded-full"
          style={{ backgroundColor: 'var(--skeleton)' }}
        />
        <div
          className="h-7 w-24 rounded-full"
          style={{ backgroundColor: 'var(--skeleton)' }}
        />
      </div>
    </div>
  );
}

function Home() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchMatches = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const { data: matchRows, error: matchesError } = await supabase
          .from('matches')
          .select('id, team1_id, team2_id, start_time, status')
          .order('start_time', { ascending: true });

        if (matchesError) {
          throw matchesError;
        }

        const teamIds = [
          ...new Set(
            (matchRows || [])
              .flatMap((match) => [match.team1_id, match.team2_id])
              .filter(Boolean),
          ),
        ];

        let teamMap = {};

        if (teamIds.length > 0) {
          const { data: teamRows, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo')
            .in('id', teamIds);

          if (teamsError) {
            throw teamsError;
          }

          teamMap = (teamRows || []).reduce((accumulator, team) => {
            accumulator[team.id] = {
              name: team.name || FALLBACK_TEAM.name,
              logo: team.logo || FALLBACK_TEAM.logo,
            };
            return accumulator;
          }, {});
        }

        const mappedMatches = (matchRows || []).map((match) => ({
          ...match,
          status: match.status?.toLowerCase() || 'upcoming',
          formattedStartTime: formatMatchStartTime(match.start_time),
          team1: teamMap[match.team1_id] || FALLBACK_TEAM,
          team2: teamMap[match.team2_id] || FALLBACK_TEAM,
        }));

        if (isMounted) {
          setMatches(mappedMatches);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to load matches right now. Please try again shortly.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        

        {isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : null}

        {!isLoading && errorMessage ? (
          <section
            className="feedback-panel"
            style={{
              backgroundColor: '#fffaf9',
              borderColor: 'rgba(248, 113, 113, 0.24)',
              color: 'var(--text-primary)',
            }}
          >
            <h2 className="text-base font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage}
            </p>
          </section>
        ) : null}

        {!isLoading && !errorMessage && matches.length === 0 ? (
          <section className="feedback-panel bg-white" style={{ borderColor: 'var(--border-soft)' }}>
            <h2 className="text-base font-semibold">No matches available</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Check back later for new fixtures and live updates.
            </p>
          </section>
        ) : null}

        {!isLoading && !errorMessage
          ? matches.map((match) => <MatchCard key={match.id} match={match} />)
          : null}
      </div>
    </main>
  );
}

export default Home;
