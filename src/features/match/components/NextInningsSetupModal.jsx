import React, { useState } from "react";

function NextInningsSetupModal({
  open,
  battingTeamName,
  bowlingTeamName,
  battingPlayers,
  bowlingPlayers,
  onClose,
  onConfirm,
}) {
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      setError("Please select striker, non-striker and bowler.");
      return;
    }
    if (String(strikerId) === String(nonStrikerId)) {
      setError("Striker and non-striker must be different.");
      return;
    }
    setError("");
    onConfirm({ strikerId, nonStrikerId, bowlerId });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Start Next Innings</h3>
        <p className="mt-1 text-sm text-slate-500">
          {battingTeamName} batting, {bowlingTeamName} bowling
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Striker</label>
          <select className="w-full rounded-xl border border-slate-200 p-3" value={strikerId} onChange={(e) => setStrikerId(e.target.value)}>
            <option value="">Select striker</option>
            {battingPlayers.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-slate-700">Non-Striker</label>
          <select className="w-full rounded-xl border border-slate-200 p-3" value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)}>
            <option value="">Select non-striker</option>
            {battingPlayers.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-slate-700">Current Bowler</label>
          <select className="w-full rounded-xl border border-slate-200 p-3" value={bowlerId} onChange={(e) => setBowlerId(e.target.value)}>
            <option value="">Select bowler</option>
            {bowlingPlayers.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={submit}>Start Innings</button>
        </div>
      </div>
    </div>
  );
}

export default NextInningsSetupModal;
