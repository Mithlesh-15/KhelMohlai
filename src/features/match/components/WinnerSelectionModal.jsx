import React, { useEffect, useState } from "react";

function TeamBadge({ team, active }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm">
        {team?.logo ? (
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
            {String(team?.name ?? "T").slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold leading-tight text-slate-900">
          {team?.name ?? "Team"}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Mark as match winner
        </p>
      </div>
    </div>
  );
}

function WinnerSelectionModal({ open, teams, onClose, onConfirm }) {
  const [winnerId, setWinnerId] = useState("");

  useEffect(() => {
    if (open) {
      setWinnerId("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-5 text-white sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
            Complete Match
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            Who won the match?
          </h3>
          <p className="mt-2 max-w-lg text-sm text-slate-300">
            Select the winning team to finalize the match and switch the page
            into the completed presentation.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                className="text-left"
                onClick={() => setWinnerId(String(team.id))}
              >
                <TeamBadge
                  team={team}
                  active={String(winnerId) === String(team.id)}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!winnerId}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onConfirm(winnerId)}
            >
              Confirm Winner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WinnerSelectionModal;
