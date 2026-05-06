import type { Task } from "@/types/dashboard";
import { TaskRow } from "./TaskRow";

type TasksDepartmentSectionProps = {
  slug: string;
  name: string;
  tasksAutomated: number;
  tasksTotal: number;
  tasks: Task[];
};

export function TasksDepartmentSection({
  name,
  tasksAutomated,
  tasksTotal,
  tasks,
}: TasksDepartmentSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <details open className="mb-12">
      <summary className="cursor-pointer flex items-baseline justify-between gap-4 mb-4 list-none [&::-webkit-details-marker]:hidden">
        <h2 className="text-2xl font-bold tracking-tight text-ink">{name}</h2>
        <span className="text-sm text-ink-muted">
          {tasksAutomated}/{tasksTotal} automated
        </span>
      </summary>
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
    </details>
  );
}
