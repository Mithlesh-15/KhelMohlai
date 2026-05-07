import React, { useState } from "react";

function NewBatterModal({ open, players, onClose, onConfirm }) {
  const [batterId, setBatterId] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Select New Batter</h3>
        <select className="mt-4 w-full rounded-xl border border-slate-200 p-3" value={batterId} onChange={(e) => setBatterId(e.target.value)}>
          <option value="">Select batter</option>
          {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
        </select>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => batterId && onConfirm(batterId)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewBatterModal;
