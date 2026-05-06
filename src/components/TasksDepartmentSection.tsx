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
  return (
    <details open className="mb-12">
      <summary className="cursor-pointer flex items-baseline justify-between gap-4 mb-4 list-none [&::-webkit-details-marker]:hidden">
        <h2 className="text-2xl font-bold tracking-tight text-ink">{name}</h2>
        <span className="text-sm text-ink-muted">
          {tasksAutomated}/{tasksTotal} automated
        </span>
      </summary>
      <table className="w-full border-t border-line">
        <thead className="sr-only">
          <tr>
            <th>Status</th>
            <th>Task</th>
            <th>Hours per week</th>
            <th>Automated by</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <TaskRow
              key={`${t.name}-${i}`}
              name={t.name}
              hoursPerWeek={t.hours_per_week}
              automatedBy={t.automated_by}
            />
          ))}
        </tbody>
      </table>
    </details>
  );
}
