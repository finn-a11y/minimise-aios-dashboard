"use client";

import { useState } from "react";
import type { Automation } from "@/types/dashboard";
import { StatusPill } from "./StatusPill";
import { AssetDrawer } from "./AssetDrawer";

type AutomationListProps = { automations: Automation[] };

/** Renders the per-department automation list and owns the linked-assets
 *  drawer state. Each row is a button — click opens the drawer for that
 *  automation; assets come from the row's `linked_assets` field. */
export function AutomationList({ automations }: AutomationListProps) {
  const [open, setOpen] = useState<Automation | null>(null);

  if (automations.length === 0) return null;

  return (
    <>
      <ul className="mt-6 pt-6 border-t border-line flex flex-col gap-1">
        {automations.map((a) => {
          const assetCount = a.linked_assets?.length ?? 0;
          return (
            <li key={a.skill}>
              <button
                type="button"
                onClick={(e) => {
                  // Don't trigger the parent <details> toggle.
                  e.stopPropagation();
                  setOpen(a);
                }}
                aria-label={`View linked assets for ${a.name}`}
                className="w-full text-left flex flex-col gap-1.5 -mx-3 px-3 py-2 rounded-sm hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusPill status={a.status} />
                  <span className="font-semibold text-ink">{a.name}</span>
                  <span
                    className="ml-auto text-[10px] uppercase tracking-widest text-ink-muted font-mono tabular-nums"
                    aria-hidden="true"
                  >
                    {assetCount} {assetCount === 1 ? "asset" : "assets"}
                  </span>
                </div>
                <p className="text-sm text-ink-muted leading-snug">
                  {a.description}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <AssetDrawer automation={open} onClose={() => setOpen(null)} />
    </>
  );
}
