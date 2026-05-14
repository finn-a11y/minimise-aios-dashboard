/**
 * Pure formatters shared across the AIOS pages. Kept separate from pills.jsx
 * so React Fast Refresh doesn't complain about mixed exports (components vs.
 * helpers).
 */

export function fmtMinutes(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!isFinite(n) || n === 0) return '0m';
  if (n < 1) return `${n.toFixed(2)}m`;
  if (n < 10) return `${n.toFixed(1)}m`;
  return `${Math.round(n)}m`;
}

export function fmtHours(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!isFinite(n)) return '—';
  if (n === 0) return '0h';
  if (n < 1) return `${n.toFixed(2)}h`;
  if (n < 10) return `${n.toFixed(1)}h`;
  return `${Math.round(n)}h`;
}

export function fmtRelativeTime(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(Math.round((now - then) / 1000), 0);
  if (diffSec < 60) return 'just now';
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mon = Math.round(day / 30);
  return `${mon}mo ago`;
}
