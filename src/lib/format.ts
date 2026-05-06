export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "0";
  return hours.toFixed(1).replace(/\.0$/, "");
}
