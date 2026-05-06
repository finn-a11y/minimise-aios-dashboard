import type { Automation } from "@/types/dashboard";
import { StatusPill } from "./StatusPill";
import { formatHours } from "@/lib/format";

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
    <details className="group bg-surface p-8 cursor-pointer">
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
      {automations.length > 0 && (
        <ul className="mt-6 pt-6 border-t border-line flex flex-col gap-4">
          {automations.map((a) => (
            <li key={a.skill} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusPill status={a.status} />
                <span className="font-semibold text-ink">{a.name}</span>
                <span className="text-xs text-ink-muted">
                  {formatHours(a.hours_per_week)}h
                </span>
              </div>
              <p className="text-sm text-ink-muted leading-snug">
                {a.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
