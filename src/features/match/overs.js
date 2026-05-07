export function clampNonNegativeInteger(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function ballsToOversParts(totalBalls) {
  const balls = clampNonNegativeInteger(totalBalls);
  return {
    overs: Math.floor(balls / 6),
    balls: balls % 6,
  };
}

export function ballsToOversLabel(totalBalls) {
  const parts = ballsToOversParts(totalBalls);
  return `${parts.overs}.${parts.balls}`;
}

export function oversPartsToBalls(overs, balls) {
  const safeOvers = clampNonNegativeInteger(overs);
  let safeBalls = clampNonNegativeInteger(balls);
  if (safeBalls > 5) {
    const carry = Math.floor(safeBalls / 6);
    safeBalls %= 6;
    return (safeOvers + carry) * 6 + safeBalls;
  }
  return safeOvers * 6 + safeBalls;
}

export function parseOversStringToBalls(value) {
  if (value == null || value === "") return 0;
  const trimmed = String(value).trim();
  if (!trimmed.includes(".")) return oversPartsToBalls(trimmed, 0);
  const [overs, balls] = trimmed.split(".");
  return oversPartsToBalls(overs, balls);
}
