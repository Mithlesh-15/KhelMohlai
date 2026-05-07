import React from "react";

function BowlerTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border-soft)" }}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Bowler</th>
            <th className="px-4 py-3 font-semibold">O</th>
            <th className="px-4 py-3 font-semibold">R</th>
            <th className="px-4 py-3 font-semibold">W</th>
            <th className="px-4 py-3 font-semibold">Econ</th>
          </tr>
        </thead>
        <tbody>
          {rows?.length ? (
            rows.map((row) => (
              <tr key={row.id} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.overs}</td>
                <td className="px-4 py-3">{row.runs}</td>
                <td className="px-4 py-3">{row.wickets}</td>
                <td className="px-4 py-3">{row.economy}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-4 text-sm" colSpan={5} style={{ color: "var(--text-secondary)" }}>
                No bowling data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BowlerTable;
