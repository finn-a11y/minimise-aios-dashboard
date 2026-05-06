export function formatHours(hours: number): string {
  if (Number.isInteger(hours)) return `${hours}`;
  return hours.toFixed(1).replace(/\.0$/, "");
}

export function formatRatio(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}
