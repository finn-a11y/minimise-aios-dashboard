export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "0";
  return hours.toFixed(1).replace(/\.0$/, "");
}

/** Lower-case, dash-separated slug used for localStorage keys and DOM ids.
 *  e.g. "Asset creation" → "asset-creation", "AIOS maintenance" → "aios-maintenance". */
export function kebab(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
