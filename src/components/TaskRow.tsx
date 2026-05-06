import { formatHours } from "@/lib/format";
import type { TaskStatus } from "@/types/dashboard";

type TaskRowProps = {
  name: string;
  hoursPerWeek: number;
  automatedBy: string | null;
  status: TaskStatus;
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

export function TaskRow({
  name,
  hoursPerWeek,
  automatedBy,
  status,
}: TaskRowProps) {
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="py-3 pr-4 w-8">
        <CheckboxIndicator status={status} />
      </td>
      <td className={`py-3 pr-4 ${status === "done" ? "text-ink" : "text-ink-muted"}`}>
        {name}
      </td>
      <td className="py-3 pr-4 text-right text-ink-muted text-sm w-24">
        {formatHours(hoursPerWeek)}h
      </td>
      <td className="py-3 text-sm font-mono text-ink-muted">
        {automatedBy ?? "—"}
      </td>
    </tr>
  );
}
