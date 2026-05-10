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

function MatchTeam({ align = "left", logo, name }) {
  const isRightAligned = align === "right";

  return (
    <div
      className={[
        "flex min-w-0 flex-1 items-center gap-3",
        isRightAligned ? "flex-row-reverse text-right" : "text-left",
      ].join(" ")}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 shadow-sm"
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
          className="break-words text-sm font-semibold sm:text-base"
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

  return (
    <Link
      to={`/match/${match.id}`}
      className={[
        "surface-card match-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        statusKey === "live" ? "match-card-live" : "",
      ].join(" ")}
      style={{
        "--tw-ring-color": "rgba(1, 69, 242, 0.35)",
      }}
      aria-label={`Open match ${match.team1.name || "TBL"} versus ${match.team2.name || "TBL"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <MatchTeam
          logo={
            match.team1.logo ||
            "https://i.pinimg.com/736x/6c/a7/fd/6ca7fdf326848b6f3c149a1245cb47d9.jpg"
          }
          name={match.team1.name || "TBL"}
        />

        <div className="shrink-0 px-2 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            VS
          </p>
        </div>

        <MatchTeam
          align="right"
          logo={
            match.team2.logo ||
            "https://i.pinimg.com/736x/6c/a7/fd/6ca7fdf326848b6f3c149a1245cb47d9.jpg"
          }
          name={match.team2.name || "TBL"}
        />
      </div>

      <div
        className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
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
