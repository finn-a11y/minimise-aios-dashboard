"use client";

import { useSyncExternalStore, useCallback } from "react";
import type { Task } from "@/types/dashboard";
import { TaskRow } from "./TaskRow";
import { formatHours, kebab } from "@/lib/format";

type CategorySectionProps = {
  deptSlug: string;
  name: string;
  tasksAutomated: number;
  tasksTotal: number;
  hoursSavedPerWeek: number;
  tasks: Task[];
};

// ─── Tiny module-scoped store ────────────────────────────────────────────────
//
// We need to re-render after writing to localStorage. The React 19 lint rule
// `react-hooks/set-state-in-effect` blocks the obvious useEffect+useState
// pattern, and useSyncExternalStore is the recommended replacement.
//
// We track a single integer "version" that subscribers listen to; every
// toggle bumps the version, which retriggers a snapshot read.

const listeners = new Set<() => void>();
let version = 0;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getVersion() {
  return version;
}
function bumpVersion() {
  version++;
  listeners.forEach((cb) => cb());
}

function readStored(storageKey: string): boolean {
  try {
    const v = window.localStorage.getItem(storageKey);
    if (v === "closed") return false;
    if (v === "open") return true;
  } catch {
    // localStorage unavailable (Safari private mode etc.) — fall through
  }
  return true; // default = open
}

/** Collapsible task group, one per category inside a department.
 *  Open by default; user state persisted to localStorage per (dept, category). */
export function CategorySection({
  deptSlug,
  name,
  tasksAutomated,
  tasksTotal,
  hoursSavedPerWeek,
  tasks,
}: CategorySectionProps) {
  const storageKey = `tasks-cat-${kebab(deptSlug)}-${kebab(name)}`;

  // Track the global version so React re-renders this component when any
  // CategorySection toggles (per-key snapshot read below stays cheap).
  useSyncExternalStore(
    subscribe,
    getVersion,
    () => 0 // server snapshot — irrelevant for SSR markup
  );

  // SSR renders open=true (matching the default). On the client we read the
  // current localStorage value directly during render — safe because the
  // version subscription above forces a fresh render after every toggle().
  const open = typeof window === "undefined" ? true : readStored(storageKey);

  const toggle = useCallback(() => {
    const next = !readStored(storageKey);
    try {
      window.localStorage.setItem(storageKey, next ? "open" : "closed");
    } catch {
      // ignore — non-essential persistence
    }
    bumpVersion();
  }, [storageKey]);

  // Skip empty categories defensively (build script already drops them).
  if (tasks.length === 0) return null;

  const headerId = `cat-${kebab(deptSlug)}-${kebab(name)}`;
  const panelId = `${headerId}-panel`;

  return (
    <div className="mb-6">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="group w-full flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-sm hover:bg-surface-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Chevron open={open} />
          <h3 className="text-base md:text-lg font-semibold text-ink truncate">
            {name}
          </h3>
          <span className="text-xs text-ink-muted font-mono tabular-nums flex-shrink-0">
            {tasksAutomated}/{tasksTotal}
          </span>
        </div>
        {hoursSavedPerWeek > 0 ? (
          <span className="inline-block rounded-sm px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-xs font-mono tabular-nums flex-shrink-0">
            {formatHours(hoursSavedPerWeek)} hrs/wk
          </span>
        ) : (
          <span className="text-xs text-ink-muted flex-shrink-0">—</span>
        )}
      </button>

      {open && (
        <div id={panelId} role="region" aria-labelledby={headerId}>
          <table className="w-full border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className="sr-only py-2 pr-4 text-left w-8">Status</th>
                <th className="py-2 pr-4 text-left text-[10px] font-semibold tracking-widest uppercase text-ink-muted">
                  Task
                </th>
                <th className="py-2 pr-4 text-left text-[10px] font-semibold tracking-widest uppercase text-ink-muted w-24">
                  Mode
                </th>
                <th className="hidden md:table-cell py-2 pr-4 text-right text-[10px] font-semibold tracking-widest uppercase text-ink-muted w-16">
                  Was
                </th>
                <th className="hidden md:table-cell py-2 pr-4 text-right text-[10px] font-semibold tracking-widest uppercase text-ink-muted w-16">
                  Now
                </th>
                <th className="py-2 pr-4 text-right text-[10px] font-semibold tracking-widest uppercase text-ink-muted w-20">
                  Saved
                </th>
                <th className="py-2 text-left text-[10px] font-semibold tracking-widest uppercase text-ink-muted">
                  Automated by
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <TaskRow
                  key={`${t.name}-${i}`}
                  name={t.name}
                  automatedBy={t.automated_by}
                  status={t.status}
                  mode={t.mode}
                  manualHoursPerWeek={t.manual_hours_per_week}
                  automatedHoursPerWeek={t.automated_hours_per_week}
                  hoursSavedPerWeek={t.hours_saved_per_week}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`text-ink-muted flex-shrink-0 transition-transform duration-150 ${
        open ? "rotate-90" : "rotate-0"
      }`}
    >
      <path
        d="M4 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
