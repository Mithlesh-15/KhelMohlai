import React from "react";

function ExtrasModal({ open, extraType, onClose, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">{extraType} Runs</h3>
        <p className="mt-1 text-sm text-slate-500">How many runs?</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((run) => (
            <button key={run} className="h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold" onClick={() => onSelect(run)}>
              {run}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ExtrasModal;
