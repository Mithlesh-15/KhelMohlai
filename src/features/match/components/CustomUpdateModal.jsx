import React, { useEffect, useMemo, useState } from "react";
import {
  ballsToOversParts,
  clampNonNegativeInteger,
  oversPartsToBalls,
} from "../overs";

const TABS = [
  { key: "innings", label: "Innings Summary" },
  { key: "batters", label: "Batters" },
  { key: "bowlers", label: "Bowlers" },
];

function numberInput(value, onChange, min = 0) {
  return {
    type: "number",
    min,
    value,
    onChange: (event) => onChange(clampNonNegativeInteger(event.target.value)),
  };
}

function CustomUpdateModal({
  open,
  current,
  battingPlayers,
  bowlingPlayers,
  batterRows,
  bowlerRows,
  onClose,
  onConfirm,
  isSubmitting,
}) {
  const [activeTab, setActiveTab] = useState("innings");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  const initialForm = useMemo(() => {
    const parts = ballsToOversParts(current?.balls ?? 0);
    return {
      runs: clampNonNegativeInteger(current?.runs),
      wickets: clampNonNegativeInteger(current?.wickets),
      overs: parts.overs,
      ballsInOver: parts.balls,
      strikerId: current?.strikerId ? String(current.strikerId) : "",
      nonStrikerId: current?.nonStrikerId ? String(current.nonStrikerId) : "",
      currentBowlerId: current?.currentBowlerId ? String(current.currentBowlerId) : "",
      batters: (battingPlayers ?? []).map((player) => {
        const existing = (batterRows ?? []).find(
          (row) => String(row.playerId) === String(player.id),
        );
        return {
          playerId: String(player.id),
          name: player.name,
          runs: clampNonNegativeInteger(existing?.runs),
          balls: clampNonNegativeInteger(existing?.balls),
          isOut: Boolean(existing?.isOut),
        };
      }),
      bowlers: (bowlingPlayers ?? []).map((player) => {
        const existing = (bowlerRows ?? []).find(
          (row) => String(row.playerId) === String(player.id),
        );
        const oversParts = ballsToOversParts(existing?.ballsBowled ?? 0);
        return {
          playerId: String(player.id),
          name: player.name,
          overs: oversParts.overs,
          ballsInOver: oversParts.balls,
          runsConceded: clampNonNegativeInteger(existing?.runs),
          wickets: clampNonNegativeInteger(existing?.wickets),
        };
      }),
    };
  }, [batterRows, battingPlayers, bowlerRows, bowlingPlayers, current]);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setActiveTab("innings");
    setError("");
    setShowConfirm(false);
  }, [initialForm, open]);

  const updateBatter = (playerId, key, value) => {
    setForm((prev) => ({
      ...prev,
      batters: prev.batters.map((item) =>
        item.playerId === playerId ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateBowler = (playerId, key, value) => {
    setForm((prev) => ({
      ...prev,
      bowlers: prev.bowlers.map((item) =>
        item.playerId === playerId ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const validate = () => {
    if (!form) return "Form not ready.";
    if (form.ballsInOver > 8) return "Balls must be between 0 and 8.";
    if (
      form.strikerId &&
      form.nonStrikerId &&
      String(form.strikerId) === String(form.nonStrikerId)
    ) {
      return "Striker and non-striker cannot be the same.";
    }
    if (form.bowlers.some((item) => item.ballsInOver > 8)) {
      return "Bowler balls must be between 0 and 8.";
    }
    return "";
  };

  const runSave = () => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      setShowConfirm(false);
      return;
    }

    const payload = {
      summary: {
        runs: form.runs,
        wickets: form.wickets,
        balls: oversPartsToBalls(form.overs, form.ballsInOver),
      },
      strikerId: form.strikerId || null,
      nonStrikerId: form.nonStrikerId || null,
      currentBowlerId: form.currentBowlerId || null,
      batters: form.batters.map((item) => ({
        playerId: item.playerId,
        runs: item.runs,
        balls: item.balls,
        isOut: Boolean(item.isOut),
      })),
      bowlers: form.bowlers.map((item) => ({
        ...item,
        ballsBowled: oversPartsToBalls(item.overs, item.ballsInOver),
      })),
    };

    onConfirm(payload);
  };

  if (!open || !form) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/50">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl md:my-6 md:h-[92vh] md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Custom Update / Manual Sync</h3>
            <p className="text-xs text-slate-500">Recovery mode for correcting actual on-field state.</p>
          </div>
          <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="border-b border-slate-200 px-2 sm:px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {activeTab === "innings" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Total Runs</span><input placeholder="e.g. 120" className="w-full rounded-xl border border-slate-200 p-2.5" {...numberInput(form.runs, (value) => setForm((prev) => ({ ...prev, runs: value })))} /></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Wickets</span><input placeholder="e.g. 4" className="w-full rounded-xl border border-slate-200 p-2.5" {...numberInput(form.wickets, (value) => setForm((prev) => ({ ...prev, wickets: value })))} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Overs</span><input placeholder="e.g. 14" className="w-full rounded-xl border border-slate-200 p-2.5" {...numberInput(form.overs, (value) => setForm((prev) => ({ ...prev, overs: value })))} /></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Balls</span><input placeholder="0-8" className="w-full rounded-xl border border-slate-200 p-2.5" {...numberInput(form.ballsInOver, (value) => setForm((prev) => ({ ...prev, ballsInOver: value })))} max={8} /></label>
              </div>

              <label className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-slate-600">Current Striker</span>
                <select className="w-full rounded-xl border border-slate-200 p-2.5" value={form.strikerId} onChange={(e) => setForm((prev) => ({ ...prev, strikerId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {form.batters.map((item) => <option key={item.playerId} value={item.playerId}>{item.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-slate-600">Current Non-Striker</span>
                <select className="w-full rounded-xl border border-slate-200 p-2.5" value={form.nonStrikerId} onChange={(e) => setForm((prev) => ({ ...prev, nonStrikerId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {form.batters.map((item) => <option key={item.playerId} value={item.playerId}>{item.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-slate-600">Current Bowler</span>
                <select className="w-full rounded-xl border border-slate-200 p-2.5" value={form.currentBowlerId} onChange={(e) => setForm((prev) => ({ ...prev, currentBowlerId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {form.bowlers.map((item) => <option key={item.playerId} value={item.playerId}>{item.name}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {activeTab === "batters" ? (
            <div className="space-y-3">
              {form.batters.map((item) => {
                const strikeRate = item.balls ? ((item.runs / item.balls) * 100).toFixed(2) : "0.00";
                return (
                  <div key={item.playerId} className="rounded-2xl border border-slate-200 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">{item.name}</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Runs</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="Runs" {...numberInput(item.runs, (value) => updateBatter(item.playerId, "runs", value))} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Balls</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="Balls" {...numberInput(item.balls, (value) => updateBatter(item.playerId, "balls", value))} /></label>
                      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isOut)}
                          onChange={(event) =>
                            updateBatter(item.playerId, "isOut", event.target.checked)
                          }
                        />
                        Out
                      </label>
                      <div className="rounded-xl border border-slate-200 p-2 text-xs text-slate-500">SR: {strikeRate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === "bowlers" ? (
            <div className="space-y-3">
              {form.bowlers.map((item) => {
                const ballsBowled = oversPartsToBalls(item.overs, item.ballsInOver);
                const economy = ballsBowled ? ((item.runsConceded * 6) / ballsBowled).toFixed(2) : "0.00";
                return (
                  <div key={item.playerId} className="rounded-2xl border border-slate-200 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">{item.name}</p>
                    <div className="grid gap-2 sm:grid-cols-5">
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Overs</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="Overs" {...numberInput(item.overs, (value) => updateBowler(item.playerId, "overs", value))} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Balls</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="0-5" max={5} {...numberInput(item.ballsInOver, (value) => updateBowler(item.playerId, "ballsInOver", value))} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Runs</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="Runs" {...numberInput(item.runsConceded, (value) => updateBowler(item.playerId, "runsConceded", value))} /></label>
                      <label className="space-y-1"><span className="text-[11px] font-semibold text-slate-600">Wickets</span><input className="w-full rounded-xl border border-slate-200 p-2" placeholder="Wickets" {...numberInput(item.wickets, (value) => updateBowler(item.playerId, "wickets", value))} /></label>
                      <div className="rounded-xl border border-slate-200 p-2 text-xs text-slate-500">Econ: {economy}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm" onClick={() => setForm(initialForm)}>Reset Form</button>
          <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            disabled={isSubmitting}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => {
              const validationMessage = validate();
              if (validationMessage) {
                setError(validationMessage);
                return;
              }
              setError("");
              setShowConfirm(true);
            }}
          >
            Save All Changes
          </button>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <p className="text-base font-semibold text-slate-900">This will overwrite current match stats.</p>
            <p className="mt-1 text-sm text-slate-500">Use this only for manual correction/recovery.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={runSave} disabled={isSubmitting}>Confirm Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CustomUpdateModal;
