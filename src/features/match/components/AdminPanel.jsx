import React, { useMemo } from "react";

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];
const EXTRAS = [
  { label: "W", value: "WD" },
  { label: "NB", value: "NB" },
  { label: "LB", value: "LB" },
  { label: "B", value: "B" },
  { label: "P", value: "P" },
];

function AdminPanel({
  disabled,
  isSubmitting,
  status,
  onRun,
  onExtra,
  onWicket,
  onUndo,
  onCustomUpdate,
  onCompleteInnings,
  onCompleteMatch,
}) {
  const hotkeys = useMemo(
    () => ({
      "0": () => onRun(0),
      "1": () => onRun(1),
      "2": () => onRun(2),
      "3": () => onRun(3),
      "4": () => onRun(4),
      "6": () => onRun(6),
      w: onWicket,
      W: onWicket,
    }),
    [onRun, onWicket],
  );

  React.useEffect(() => {
    if (disabled || status !== "live") return undefined;

    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return;
      }
      const handler = hotkeys[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, hotkeys, status]);

  return (
    <section className="surface-card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h3 className="mt-2 text-lg font-semibold">Live Scoring Controls</h3>
        </div>
        {isSubmitting ? <span className="text-sm text-slate-500">Saving...</span> : null}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {RUN_BUTTONS.map((run) => (
          <button
            key={run}
            type="button"
            disabled={disabled || isSubmitting || status !== "live"}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            onClick={() => onRun(run)}
          >
            {run}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {EXTRAS.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={disabled || isSubmitting || status !== "live"}
            className="h-12 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            onClick={() => onExtra(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          disabled={disabled || isSubmitting || status !== "live"}
          className="h-12 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 shadow-sm disabled:opacity-50"
          onClick={onWicket}
        >
          Wicket
        </button>
        <button
          type="button"
          disabled={disabled || isSubmitting || status !== "live"}
          className="h-12 rounded-xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-700 shadow-sm disabled:opacity-50"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={disabled || isSubmitting}
          className="col-span-2 h-12 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 shadow-sm disabled:opacity-50"
          onClick={onCustomUpdate}
        >
          Custom Update
        </button>
        <button
          type="button"
          disabled={disabled || isSubmitting || status !== "live"}
          className="col-span-2 h-12 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 shadow-sm disabled:opacity-50"
          onClick={onCompleteInnings}
        >
          Complete Inning
        </button>
        <button
          type="button"
          disabled={disabled || isSubmitting}
          className="col-span-2 h-12 rounded-xl border border-rose-300 bg-rose-100 text-sm font-semibold text-rose-700 shadow-sm disabled:opacity-50"
          onClick={onCompleteMatch}
        >
          Complete Match
        </button>
      </div>
      <p className="text-xs text-slate-500">Shortcuts: 0,1,2,3,4,6 and W</p>
    </section>
  );
}

export default AdminPanel;
