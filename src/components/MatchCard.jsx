import React from "react";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  live: "status-badge status-badge-live",
  upcoming: "status-badge status-badge-upcoming",
  completed: "status-badge status-badge-completed",
};

const STATUS_LABELS = {
  live: "LIVE",
  upcoming: "UPCOMING",
  completed: "COMPLETED",
};

const STAGE_STYLES = {
  final: {
    cardClassName: "match-card-final",
    badgeClassName: "match-stage-badge match-stage-badge-final",
    label: "FINAL",
    eyebrow: "Championship Match",
  },
  semi_final: {
    cardClassName: "match-card-semi-final",
    badgeClassName: "match-stage-badge match-stage-badge-semi-final",
    label: "SEMI FINAL",
    eyebrow: "Playoff Match",
  },
  eliminator: {
    cardClassName: "match-card-eliminator",
    badgeClassName: "match-stage-badge match-stage-badge-eliminator",
    label: "ELIMINATOR",
    eyebrow: "Knockout Match",
  },
};

const FALLBACK_TEAM_LOGO =
  "https://i.pinimg.com/736x/6c/a7/fd/6ca7fdf326848b6f3c149a1245cb47d9.jpg";

function getTeamDisplay(team) {
  const hasValidTeam = Boolean(team?.name?.trim() && team?.logo?.trim());

  if (!hasValidTeam) {
    return {
      logo: FALLBACK_TEAM_LOGO,
      name: "TBD",
    };
  }

  return {
    logo: team.logo,
    name: team.name,
  };
}

function MatchTeam({ align = "left", logo, name }) {
  const isRightAligned = align === "right";

  return (
    <div
      className={[
        "flex min-w-0 flex-1 items-start gap-3 sm:items-center",
        isRightAligned ? "flex-row-reverse text-right" : "text-left",
      ].join(" ")}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 shadow-sm sm:h-14 sm:w-14"
        style={{ borderColor: "var(--border-soft)" }}
      >
        {logo ? (
          <img
            src={logo}
            alt={`${name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="text-sm font-semibold uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            {name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p
          className="break-words text-sm font-semibold leading-tight sm:text-base"
          style={{ color: "var(--text-primary)" }}
        >
          {name}
        </p>
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const statusKey = match.status?.toLowerCase() || "upcoming";
  const badgeClassName = STATUS_STYLES[statusKey] || STATUS_STYLES.upcoming;
  const badgeLabel = STATUS_LABELS[statusKey] || match.status || "UPCOMING";
  const stageKey = match.stage?.toLowerCase() || null;
  const stageStyle = stageKey ? STAGE_STYLES[stageKey] : null;
  const team1 = getTeamDisplay(match.team1);
  const team2 = getTeamDisplay(match.team2);
  const isSpecialStage = Boolean(stageStyle);
  const cardClassName = [
    "surface-card match-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    isSpecialStage ? stageStyle.cardClassName : "",
    statusKey === "live" ? "match-card-live" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      to={`/match/${match.id}`}
      className={cardClassName}
      style={{
        "--tw-ring-color": "rgba(1, 69, 242, 0.35)",
      }}
      aria-label={`Open match ${team1.name} versus ${team2.name}`}
    >
      {isSpecialStage ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{stageStyle.eyebrow}</p>
            <p
              className="mt-1 text-sm font-semibold sm:text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Tournament spotlight
            </p>
          </div>
          <span className={stageStyle.badgeClassName}>{stageStyle.label}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <MatchTeam logo={team1.logo} name={team1.name} />

        <div className="shrink-0 px-1 text-center sm:px-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            VS
          </p>
        </div>

        <MatchTeam align="right" logo={team2.logo} name={team2.name} />
      </div>

      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: "rgba(217, 226, 236, 0.9)" }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {match.formattedStartTime}
        </p>
        <span className={badgeClassName}>{badgeLabel}</span>
      </div>
    </Link>
  );
}

export default React.memo(MatchCard);
