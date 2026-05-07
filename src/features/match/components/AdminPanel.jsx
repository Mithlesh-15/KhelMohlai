import React, { useMemo } from "react";

const SCORE_ACTIONS = [
  { label: "0", runs: 0, extraType: null, isWicket: false },
  { label: "1", runs: 1, extraType: null, isWicket: false },
  { label: "2", runs: 2, extraType: null, isWicket: false },
  { label: "3", runs: 3, extraType: null, isWicket: false },
  { label: "4", runs: 4, extraType: null, isWicket: false },
  { label: "6", runs: 6, extraType: null, isWicket: false },
  { label: "Wicket", runs: 0, extraType: null, isWicket: true },
  { label: "Wide", runs: 1, extraType: "WD", isWicket: false },
  { label: "No Ball", runs: 1, extraType: "NB", isWicket: false },
  { label: "Undo", undo: true },
];

function actionStyle(label) {
  if (label === "4") return "bg-blue-50 text-blue-700 border-blue-200";
  if (label === "6") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (label === "Wicket") return "bg-rose-50 text-rose-700 border-rose-200";
  if (label === "Undo") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function AdminPanel({ disabled, onAction, isSubmitting }) {
  const hotkeys = useMemo(
    () => ({
      "0": SCORE_ACTIONS[0],
      "1": SCORE_ACTIONS[1],
      "2": SCORE_ACTIONS[2],
      "3": SCORE_ACTIONS[3],
      "4": SCORE_ACTIONS[4],
      "6": SCORE_ACTIONS[5],
      w: SCORE_ACTIONS[6],
      W: SCORE_ACTIONS[6],
    }),
    [],
  );

  React.useEffect(() => {
    if (disabled) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const action = hotkeys[event.key];
      if (!action) {
        return;
      }

      event.preventDefault();
      onAction(action);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, hotkeys, onAction]);

  return (
    <section className="surface-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h3 className="mt-2 text-lg font-semibold">Scoring Controls</h3>
        </div>
        {isSubmitting ? <span className="text-sm text-slate-500">Saving...</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SCORE_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`h-14 rounded-2xl border text-sm font-semibold shadow-sm ${actionStyle(action.label)} disabled:opacity-50`}
            disabled={disabled || isSubmitting}
            onClick={() => onAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Shortcuts: 0,1,2,3,4,6 and W</p>
    </section>
  );
}

export default AdminPanel;
