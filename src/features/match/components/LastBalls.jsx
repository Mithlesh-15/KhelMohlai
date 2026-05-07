import React from "react";

function toneClass(label) {
  if (label === "4") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  if (label === "6") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (label === "W") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function LastBalls({ balls }) {
  if (!balls?.length) {
    return (
      <section className="surface-card">
        <h3 className="text-base font-semibold">Last 12 Balls</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          No deliveries yet.
        </p>
      </section>
    );
  }

  return (
    <section className="surface-card">
      <h3 className="text-base font-semibold">Last 12 Balls</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {balls.map((ball) => (
          <span
            key={ball.id}
            className={`inline-flex min-w-10 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset ${toneClass(ball.label)}`}
          >
            {ball.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export default LastBalls;
