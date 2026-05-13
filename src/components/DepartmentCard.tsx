import type { Automation } from "@/types/dashboard";
import { formatHours } from "@/lib/format";
import { AutomationList } from "./AutomationList";

type DepartmentCardProps = {
  slug: string;
  name: string;
  automationsLive: number;
  tasksAutomated: number;
  tasksTotal: number;
  hoursSavedPerWeek: number;
  automations: Automation[];
};

export function DepartmentCard({
  name,
  automationsLive,
  tasksAutomated,
  tasksTotal,
  hoursSavedPerWeek,
  automations,
}: DepartmentCardProps) {
  return (
    <details className="group bg-surface p-8 cursor-pointer border border-neutral-200 rounded-sm min-h-[220px] hover:border-neutral-400 transition-colors">
      <summary className="list-none flex flex-col gap-4 [&::-webkit-details-marker]:hidden">
        <h3 className="text-2xl font-bold tracking-tight text-ink">{name}</h3>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-widest text-ink-muted">
              hrs/wk
            </dt>
            <dd className="text-lg font-semibold text-ink">
              {formatHours(hoursSavedPerWeek)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-widest text-ink-muted">
              live
            </dt>
            <dd className="text-lg font-semibold text-ink">
              {automationsLive}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] uppercase tracking-widest text-ink-muted">
              tasks
            </dt>
            <dd className="text-lg font-semibold text-ink">
              {tasksAutomated}/{tasksTotal}
            </dd>
          </div>
        </dl>
      </summary>
      <AutomationList automations={automations} />
    </details>
  );
}
