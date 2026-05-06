import type { AutomationStatus } from "@/types/dashboard";

type StatusPillProps = {
  status: AutomationStatus;
};

const styles: Record<AutomationStatus, string> = {
  live: "bg-status-live/15 text-status-live",
  building: "bg-status-building/15 text-status-building",
  queued: "bg-status-queued/20 text-status-queued",
  killed: "bg-status-killed/15 text-status-killed line-through",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-block rounded-full text-[10px] uppercase tracking-wide px-2 py-0.5 font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
