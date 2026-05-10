import React, { useEffect, useState } from "react";

function ExtrasModal({ open, extraType, onClose, onSelect }) {
  const [shouldSwapStrike, setShouldSwapStrike] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldSwapStrike(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">{extraType} Runs</h3>
        <p className="mt-1 text-sm text-slate-500">How many runs?</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((run) => (
            <button key={run} className="h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold" onClick={() => onSelect({ runs: run, shouldSwapStrike })}>
              {run}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={shouldSwapStrike}
                onChange={(e) => setShouldSwapStrike(e.target.checked)}
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600/20"></div>
            </div>
            <span className="text-sm font-medium text-slate-700">Change Strike</span>
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ExtrasModal;
