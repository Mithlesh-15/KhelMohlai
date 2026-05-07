import React, { useMemo, useState } from "react";

function StartMatchModal({ open, teams, teamPlayersMap, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [battingTeamId, setBattingTeamId] = useState(teams?.[0]?.id ?? "");
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [error, setError] = useState("");

  const bowlingTeamId = useMemo(
    () => teams?.find((team) => String(team.id) !== String(battingTeamId))?.id ?? "",
    [battingTeamId, teams],
  );

  const battingPlayers = useMemo(
    () => teamPlayersMap?.[String(battingTeamId)] ?? [],
    [battingTeamId, teamPlayersMap],
  );

  const bowlingPlayers = useMemo(
    () => teamPlayersMap?.[String(bowlingTeamId)] ?? [],
    [bowlingTeamId, teamPlayersMap],
  );

  if (!open) return null;

  const submit = () => {
    if (!battingTeamId || !bowlingTeamId || !strikerId || !nonStrikerId || !bowlerId) {
      setError("Please complete all fields.");
      return;
    }
    if (String(strikerId) === String(nonStrikerId)) {
      setError("Striker and non-striker must be different.");
      return;
    }
    setError("");
    onConfirm({ battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId });
  };

  const goToPlayerStep = () => {
    if (!battingTeamId || !bowlingTeamId) {
      setError("Please select batting and bowling teams.");
      return;
    }
    setError("");
    setStep(2);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Start Match {step === 1 ? "- Teams" : "- Players"}</h3>
        <div className="mt-4 space-y-3">
          {step === 1 ? (
            <>
              <label className="block text-sm font-medium text-slate-700">Batting Team</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={battingTeamId} onChange={(e) => setBattingTeamId(e.target.value)}>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700">Bowling Team</label>
              <input className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50" value={teams.find((team) => String(team.id) === String(bowlingTeamId))?.name ?? ""} readOnly />
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">Striker</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={strikerId} onChange={(e) => setStrikerId(e.target.value)}>
                <option value="">Select striker</option>
                {battingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700">Non-Striker</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)}>
                <option value="">Select non-striker</option>
                {battingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700">Current Bowler</label>
              <select className="w-full rounded-xl border border-slate-200 p-3" value={bowlerId} onChange={(e) => setBowlerId(e.target.value)}>
                <option value="">Select bowler</option>
                {bowlingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>
            </>
          )}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {step === 2 ? (
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              Back
            </button>
          ) : null}
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            onClick={() => {
              setStep(1);
              setError("");
              onClose();
            }}
          >
            Cancel
          </button>
          {step === 1 ? (
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={goToPlayerStep}>
              OK
            </button>
          ) : (
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={submit}>
              Start Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StartMatchModal;
