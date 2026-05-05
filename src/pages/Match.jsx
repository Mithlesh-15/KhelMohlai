import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../utils/supabase';

const FALLBACK_TEAM = {
  name: 'TBD',
  logo: '',
};

const SCORE_ACTIONS = [
  { label: '0', runs: 0, extraType: null, isWicket: false, tone: 'default' },
  { label: '1', runs: 1, extraType: null, isWicket: false, tone: 'default' },
  { label: '2', runs: 2, extraType: null, isWicket: false, tone: 'default' },
  { label: '3', runs: 3, extraType: null, isWicket: false, tone: 'default' },
  { label: '4', runs: 4, extraType: null, isWicket: false, tone: 'four' },
  { label: '6', runs: 6, extraType: null, isWicket: false, tone: 'six' },
  { label: 'W', runs: 0, extraType: null, isWicket: true, tone: 'wicket' },
  { label: 'WD', runs: 1, extraType: 'WD', isWicket: false, tone: 'default' },
];

const BUTTON_STYLES = {
  default: {
    backgroundColor: '#f8fafc',
    borderColor: 'var(--border-soft)',
    color: 'var(--text-primary)',
  },
  four: {
    backgroundColor: 'var(--upcoming-bg)',
    borderColor: 'var(--upcoming-border)',
    color: 'var(--upcoming-text)',
  },
  six: {
    backgroundColor: 'var(--completed-bg)',
    borderColor: 'var(--completed-border)',
    color: 'var(--completed-text)',
  },
  wicket: {
    backgroundColor: 'var(--live-bg)',
    borderColor: 'var(--live-border)',
    color: 'var(--danger-text)',
  },
};

function formatOvers(totalBalls) {
  const safeBalls = Number.isFinite(totalBalls) ? Math.max(totalBalls, 0) : 0;
  return `${Math.floor(safeBalls / 6)}.${safeBalls % 6}`;
}

// function formatBallLabel(ball) {
//   if (!ball) {
//     return '-';
//   }

//   if (ball.is_wicket) {
//     return 'W';
//   }

//   if (ball.extra_type === 'WD') {
//     return 'WD';
//   }

//   return String(ball.runs ?? 0);
// }

function TeamBadge({ team, align = 'left' }) {
  const isRightAligned = align === 'right';

  return (
    <div
      className={[
        'flex min-w-0 flex-1 items-center gap-3',
        isRightAligned ? 'flex-row-reverse text-right' : 'text-left',
      ].join(' ')}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 shadow-sm sm:h-16 sm:w-16"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {team.logo ? (
          <img src={team.logo} alt={`${team.name} logo`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-base font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
            {team.name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-base font-semibold sm:text-lg" style={{ color: 'var(--text-primary)' }}>
          {team.name}
        </p>
      </div>
    </div>
  );
}

function ScoringButton({ action, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(action)}
      className="flex h-14 items-center justify-center rounded-2xl border text-base font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      style={BUTTON_STYLES[action.tone]}
    >
      {action.label}
    </button>
  );
}

function LoadingPanel() {
  return (
    <div className="surface-card animate-pulse">
      <div className="flex items-center justify-between gap-4">
        {[0, 1].map((item) => (
          <div key={item} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-14 w-14 rounded-2xl" style={{ backgroundColor: 'var(--skeleton)' }} />
            <div className="flex-1">
              <div className="h-4 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3 text-center">
        <div className="mx-auto h-10 w-32 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
        <div className="mx-auto h-4 w-20 rounded-full" style={{ backgroundColor: 'var(--skeleton)' }} />
      </div>
    </div>
  );
}

function Match() {
  const { matchId } = useParams();
  const [session, setSession] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [innings, setInnings] = useState(null);
  const [balls, setBalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLatestInnings = useCallback(async () => {
    const { data, error } = await supabase
      .from('innings')
      .select('id, match_id, runs, wickets, balls')
      .eq('match_id', matchId)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const latestInnings = data?.[0] || {
      id: null,
      match_id: matchId,
      runs: 0,
      wickets: 0,
      balls: 0,
    };

    setInnings({
      id: latestInnings.id,
      match_id: latestInnings.match_id,
      runs: latestInnings.runs || 0,
      wickets: latestInnings.wickets || 0,
      balls: latestInnings.balls || 0,
    });
  }, [matchId]);

  const fetchRecentBalls = useCallback(async () => {
    const { data, error } = await supabase
      .from('balls')
      .select('id, match_id, innings_id, runs, is_wicket, extra_type')
      .eq('match_id', matchId)
      .order('id', { ascending: false })
      .limit(6);

    if (error) {
      throw error;
    }

    setBalls((data || []).reverse());
  }, [matchId]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        setSession(data.session);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const { data: matchRow, error: matchError } = await supabase
          .from('matches')
          .select('id, team1_id, team2_id, status')
          .eq('id', matchId)
          .single();

        if (matchError) {
          throw matchError;
        }

        const teamIds = [matchRow.team1_id, matchRow.team2_id].filter(Boolean);
        const { data: teamRows, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo')
          .in('id', teamIds);

        if (teamsError) {
          throw teamsError;
        }

        const teamMap = (teamRows || []).reduce((accumulator, team) => {
          accumulator[team.id] = {
            name: team.name || FALLBACK_TEAM.name,
            logo: team.logo || FALLBACK_TEAM.logo,
          };
          return accumulator;
        }, {});

        if (isMounted) {
          setMatchDetails({
            id: matchRow.id,
            status: matchRow.status?.toLowerCase() || 'live',
            team1: teamMap[matchRow.team1_id] || FALLBACK_TEAM,
            team2: teamMap[matchRow.team2_id] || FALLBACK_TEAM,
          });
        }

        await Promise.all([fetchLatestInnings(), fetchRecentBalls()]);
      } catch (error) {
        console.error('Failed to fetch match detail data', error);

        if (isMounted) {
          setErrorMessage('Unable to load this match right now. Please try again shortly.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchLatestInnings, fetchRecentBalls, matchId]);

  useEffect(() => {
    if (!matchId) {
      return undefined;
    }

    const inningsChannel = supabase
      .channel(`match-innings-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'innings',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          console.log('innings update payload', payload);

          try {
            await fetchLatestInnings();
          } catch (error) {
            console.error('Failed to refresh innings from realtime update', error);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Innings realtime subscription failed for match ${matchId}`);
        }
      });

    return () => {
      supabase.removeChannel(inningsChannel);
    };
  }, [fetchLatestInnings, matchId]);

  useEffect(() => {
    if (!matchId) {
      return undefined;
    }

    const ballsChannel = supabase
      .channel(`match-balls-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balls',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          console.log('ball insert payload', payload);

          const newBall = payload.new;

          if (newBall) {
            setBalls((currentBalls) => {
              const nextBalls = [...currentBalls, newBall];
              return nextBalls.slice(-6);
            });
          }

          try {
            await fetchRecentBalls();
          } catch (error) {
            console.error('Failed to refresh balls from realtime insert', error);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Balls realtime subscription failed for match ${matchId}`);
        }
      });

    return () => {
      supabase.removeChannel(ballsChannel);
    };
  }, [fetchRecentBalls, matchId]);

  const ensureInningsRecord = async () => {
    if (innings?.id) {
      return innings.id;
    }

    const { data, error } = await supabase
      .from('innings')
      .insert({
        match_id: matchId,
        runs: innings?.runs || 0,
        wickets: innings?.wickets || 0,
        balls: innings?.balls || 0,
      })
      .select('id, match_id, runs, wickets, balls')
      .single();

    if (error) {
      throw error;
    }

    setInnings({
      id: data.id,
      match_id: data.match_id,
      runs: data.runs || 0,
      wickets: data.wickets || 0,
      balls: data.balls || 0,
    });

    return data.id;
  };

  const handleScoreAction = async (action) => {
    if (!session || !innings || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const previousInnings = innings;
    const previousBalls = balls;
    const nextInnings = {
      ...innings,
      runs: innings.runs + action.runs,
      wickets: innings.wickets + (action.isWicket ? 1 : 0),
      balls: innings.balls + (action.extraType === 'WD' ? 0 : 1),
    };

    const optimisticBall = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      innings_id: innings.id,
      runs: action.runs,
      is_wicket: action.isWicket,
      extra_type: action.extraType,
    };

    setInnings(nextInnings);
    setBalls((currentBalls) => [...currentBalls, optimisticBall].slice(-6));

    try {
      const inningsId = await ensureInningsRecord();

      const { error: ballError } = await supabase.from('balls').insert({
        match_id: matchId,
        innings_id: inningsId,
        runs: action.runs,
        is_wicket: action.isWicket,
        extra_type: action.extraType,
      });

      if (ballError) {
        throw ballError;
      }

      const { error: updateError } = await supabase
        .from('innings')
        .update({
          runs: nextInnings.runs,
          wickets: nextInnings.wickets,
          balls: nextInnings.balls,
        })
        .eq('id', inningsId);

      if (updateError) {
        throw updateError;
      }

      setInnings((currentInnings) => ({
        ...(currentInnings || nextInnings),
        id: inningsId,
        match_id: matchId,
        runs: nextInnings.runs,
        wickets: nextInnings.wickets,
        balls: nextInnings.balls,
      }));
    } catch (error) {
      console.error('Score update failed', error);
      setInnings(previousInnings);
      setBalls(previousBalls);
      setErrorMessage('Score update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreLabel = innings ? `${innings.runs}/${innings.wickets}` : '0/0';
  const oversLabel = innings ? formatOvers(innings.balls) : '0.0';

  return (
    <div className="app-shell">
      <NavBar />

      <main className="px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {isLoading ? <LoadingPanel /> : null}

          {!isLoading && errorMessage && !matchDetails ? (
            <section
              className="feedback-panel"
              style={{
                backgroundColor: '#fffaf9',
                borderColor: 'rgba(248, 113, 113, 0.24)',
                color: 'var(--text-primary)',
              }}
            >
              <h1 className="text-base font-semibold">Unable to load match</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {errorMessage}
              </p>
            </section>
          ) : null}

          {!isLoading && matchDetails && innings ? (
            <>
              <section className="surface-card">
                <div className="flex items-center justify-between gap-4">
                  <TeamBadge team={matchDetails.team1} />

                  <div className="shrink-0 px-2 text-center">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      VS
                    </p>
                  </div>

                  <TeamBadge team={matchDetails.team2} align="right" />
                </div>

                <div className="mt-8 rounded-[1.5rem] px-5 py-6 text-center" style={{ backgroundColor: 'rgba(248, 250, 252, 0.85)' }}>
                  <p className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
                    {scoreLabel}
                  </p>
                  <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                    Overs {oversLabel}
                  </p>
                </div>
              </section>

              

              {errorMessage ? (
                <section
                  className="feedback-panel"
                  style={{
                    backgroundColor: '#fffaf9',
                    borderColor: 'rgba(248, 113, 113, 0.24)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {errorMessage}
                  </p>
                </section>
              ) : null}

              {session ? (
                <section className="surface-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow">Admin Scoring</p>
                      <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Quick score controls
                      </h2>
                    </div>
                    {isSubmitting ? (
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Updating...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-3">
                    {SCORE_ACTIONS.map((action) => (
                      <ScoringButton
                        key={action.label}
                        action={action}
                        disabled={isSubmitting}
                        onClick={handleScoreAction}
                      />
                    ))}
                  </div>
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
