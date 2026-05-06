import type { AutomationMode, TaskStatus } from "@/types/dashboard";

type TaskRowProps = {
  name: string;
  automatedBy: string | null;
  status: TaskStatus;
  // v0.2 fields — optional until L2a schema-sync merges
  mode?: AutomationMode | null;
  manualHoursPerWeek?: number | null;
  automatedHoursPerWeek?: number | null;
  hoursSavedPerWeek?: number | null;
};

function CheckboxIndicator({ status }: { status: TaskStatus }) {
  if (status === "done") {
    return (
      <span
        aria-label="Automated"
        className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-emerald-400 flex-shrink-0"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 6l2.8 2.8L10 4"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === "queued") {
    return (
      <span
        aria-label="Queued for automation"
        className="inline-flex items-center justify-center w-5 h-5 rounded-sm border-2 border-dashed border-amber-400 bg-white flex-shrink-0"
      />
    );
  }

  // todo
  return (
    <span
      aria-label="Not automated"
      className="inline-flex items-center justify-center w-5 h-5 rounded-sm border border-neutral-300 bg-white flex-shrink-0"
    />
  );
}

const MODE_STYLES: Record<
  NonNullable<AutomationMode>,
  { bg: string; text: string }
> = {
  manual: { bg: "bg-neutral-100", text: "text-neutral-700" },
  scheduled: { bg: "bg-amber-100", text: "text-amber-800" },
  event: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

function ModePill({ mode }: { mode?: AutomationMode | null }) {
  if (!mode) return <span className="text-ink-muted text-sm">—</span>;
  const { bg, text } = MODE_STYLES[mode];
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${bg} ${text}`}
    >
      {mode}
    </span>
  );
}

function formatHoursCell(value?: number | null): string {
  if (value == null) return "—";
  if (Number.isInteger(value)) return `${value}h`;
  return `${value.toFixed(1).replace(/\.0$/, "")}h`;
}

export function TaskRow({
  name,
  automatedBy,
  status,
  mode,
  manualHoursPerWeek,
  automatedHoursPerWeek,
  hoursSavedPerWeek,
}: TaskRowProps) {
  const hasSaved =
    hoursSavedPerWeek != null && hoursSavedPerWeek > 0;

  return (
    <tr className="border-b border-line last:border-b-0">
      {/* Status */}
      <td className="py-3 pr-4 w-8">
        <CheckboxIndicator status={status} />
      </td>

      {/* Task name */}
      <td
        className={`py-3 pr-4 ${
          status === "done" ? "text-ink" : "text-ink-muted"
        }`}
      >
        {name}
      </td>

      {/* Mode pill — only meaningful on done tasks; show dash otherwise */}
      <td className="py-3 pr-4 w-24">
        {status === "done" ? (
          <ModePill mode={mode} />
        ) : (
          <span className="text-ink-muted text-sm">—</span>
        )}
      </td>

      {/* Was — hidden on narrow screens */}
      <td className="hidden md:table-cell py-3 pr-4 text-right text-sm text-neutral-700 font-mono tabular-nums w-16">
        {formatHoursCell(manualHoursPerWeek)}
      </td>

      {/* Now — hidden on narrow screens */}
      <td className="hidden md:table-cell py-3 pr-4 text-right text-sm text-neutral-700 font-mono tabular-nums w-16">
        {formatHoursCell(automatedHoursPerWeek)}
      </td>

      {/* Saved */}
      <td className="py-3 pr-4 text-right w-20">
        {hasSaved ? (
          <span className="inline-block rounded-sm px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-sm font-mono tabular-nums">
            {formatHoursCell(hoursSavedPerWeek)}
          </span>
        ) : (
          <span className="text-ink-muted text-sm">—</span>
        )}
      </td>

      {/* Automated by */}
      <td className="py-3 text-sm font-mono text-ink-muted">
        {automatedBy ?? "—"}
      </td>
    </tr>
  );
}
