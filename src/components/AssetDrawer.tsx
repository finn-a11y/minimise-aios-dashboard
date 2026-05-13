"use client";

import { useEffect, useRef } from "react";
import type {
  Automation,
  LinkedAsset,
  LinkedAssetRole,
  LinkedAssetType,
} from "@/types/dashboard";

type AssetDrawerProps = {
  automation: Automation | null;
  onClose: () => void;
};

// Display order for asset role groups. Anything else (defensive only — the
// enum is exhaustive) is appended at the end under a fallback heading.
const ROLE_ORDER: LinkedAssetRole[] = ["input", "output", "reference", "template"];

const ROLE_LABEL: Record<LinkedAssetRole, string> = {
  input: "Input",
  output: "Output",
  reference: "Reference",
  template: "Template",
};

const TYPE_LABEL: Record<LinkedAssetType, string> = {
  google_sheet: "Google Sheet",
  google_doc: "Google Doc",
  google_drive_folder: "Drive folder",
  gmail_label: "Gmail label",
  clickup_list: "ClickUp list",
  clickup_task: "ClickUp task",
  slack_channel: "Slack channel",
  mcp_server: "MCP capability",
  repo_file: "Repo file",
  external_repo: "External repo",
  webhook: "Webhook",
  template: "Template",
  other: "Other",
};

export function AssetDrawer({ automation, onClose }: AssetDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const open = automation != null;

  // Close on Esc + focus the close button when the drawer opens.
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);

    // Lock body scroll while the drawer is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeBtnRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!automation) return null;

  const assets = automation.linked_assets ?? [];
  const grouped = groupByRole(assets);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-drawer-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] cursor-default"
      />

      {/* Panel — slides in from the right on md+; full-screen modal on mobile */}
      <aside
        className="absolute inset-y-0 right-0 w-full md:w-[440px] lg:w-[480px] bg-surface shadow-2xl flex flex-col"
        // Avoid double-pointer-event capture when clicking inside the panel.
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-1">
              Linked assets
            </p>
            <h2
              id="asset-drawer-title"
              className="text-lg font-bold text-ink leading-snug truncate"
            >
              {automation.name}
            </h2>
            <p className="mt-1 text-xs font-mono text-ink-muted truncate">
              {automation.skill}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 -m-2 p-2 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {assets.length === 0 ? (
            <p className="text-sm text-ink-muted italic">
              No linked assets declared.
            </p>
          ) : (
            <div className="flex flex-col gap-7">
              {ROLE_ORDER.filter((r) => grouped[r] && grouped[r].length > 0).map(
                (role) => (
                  <RoleGroup
                    key={role}
                    label={ROLE_LABEL[role]}
                    assets={grouped[role]!}
                  />
                )
              )}
              {/* Defensive: any asset with an unexpected role enum value gets
                  collected under "Other". Should never fire given the build
                  validator, but it keeps the UI honest. */}
              {grouped.__other && grouped.__other.length > 0 && (
                <RoleGroup label="Other" assets={grouped.__other} />
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

type Grouped = Partial<Record<LinkedAssetRole, LinkedAsset[]>> & {
  __other?: LinkedAsset[];
};

function groupByRole(assets: LinkedAsset[]): Grouped {
  const out: Grouped = {};
  for (const a of assets) {
    if (ROLE_ORDER.includes(a.role)) {
      (out[a.role] ??= []).push(a);
    } else {
      (out.__other ??= []).push(a);
    }
  }
  return out;
}

function RoleGroup({ label, assets }: { label: string; assets: LinkedAsset[] }) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold tracking-widest uppercase text-ink-muted mb-3">
        {label}
        <span className="ml-2 text-ink-muted/70 font-mono normal-case tracking-normal">
          {assets.length}
        </span>
      </h3>
      <ul className="flex flex-col gap-3">
        {assets.map((a, i) => (
          <AssetRow key={`${a.name}-${i}`} asset={a} />
        ))}
      </ul>
    </section>
  );
}

function AssetRow({ asset }: { asset: LinkedAsset }) {
  return (
    <li className="border border-line rounded-sm p-3 bg-surface">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink text-sm leading-snug">
              {asset.name}
            </span>
            <TypeBadge type={asset.type} />
          </div>
          {asset.note && (
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              {asset.note}
            </p>
          )}
        </div>
        {asset.url && (
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${asset.name} in a new tab`}
            className="flex-shrink-0 -m-1 p-1 text-ink-muted hover:text-accent transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9M8 2h4v4M6.5 7.5 12 2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
        )}
      </div>
    </li>
  );
}

function TypeBadge({ type }: { type: LinkedAssetType }) {
  return (
    <span className="inline-block rounded-sm px-1.5 py-0.5 bg-surface-muted text-ink-muted text-[10px] font-medium uppercase tracking-wide">
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}
