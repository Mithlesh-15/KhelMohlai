import React, { useState } from "react";

function CustomUpdateModal({ open, current, onClose, onConfirm }) {
  const [form, setForm] = useState({
    runs: current.runs ?? 0,
    wickets: current.wickets ?? 0,
    balls: current.balls ?? 0,
    strikerId: current.strikerId ?? "",
    nonStrikerId: current.nonStrikerId ?? "",
    currentBowlerId: current.currentBowlerId ?? "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Custom Update</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <input className="rounded-xl border border-slate-200 p-3" type="number" value={form.runs} onChange={(e) => setForm((prev) => ({ ...prev, runs: Number(e.target.value) }))} placeholder="Innings Runs" />
          <input className="rounded-xl border border-slate-200 p-3" type="number" value={form.wickets} onChange={(e) => setForm((prev) => ({ ...prev, wickets: Number(e.target.value) }))} placeholder="Wickets" />
          <input className="rounded-xl border border-slate-200 p-3" type="number" value={form.balls} onChange={(e) => setForm((prev) => ({ ...prev, balls: Number(e.target.value) }))} placeholder="Balls" />
          <input className="rounded-xl border border-slate-200 p-3" value={form.strikerId} onChange={(e) => setForm((prev) => ({ ...prev, strikerId: e.target.value }))} placeholder="Striker ID" />
          <input className="rounded-xl border border-slate-200 p-3" value={form.nonStrikerId} onChange={(e) => setForm((prev) => ({ ...prev, nonStrikerId: e.target.value }))} placeholder="Non-striker ID" />
          <input className="rounded-xl border border-slate-200 p-3" value={form.currentBowlerId} onChange={(e) => setForm((prev) => ({ ...prev, currentBowlerId: e.target.value }))} placeholder="Current Bowler ID" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => onConfirm(form)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomUpdateModal;
