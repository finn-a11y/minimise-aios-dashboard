import type { TasksData } from "@/types/dashboard";
import { PageHeading } from "./PageHeading";
import { TasksDepartmentSection } from "./TasksDepartmentSection";
import { formatHours } from "@/lib/format";

type TasksLedgerProps = { tasksData: TasksData };

export function TasksLedger({ tasksData }: TasksLedgerProps) {
  const { stats, departments } = tasksData;
  const subtitle = `${stats.tasks_automated} of ${stats.tasks_total} automated · ${formatHours(stats.hours_saved_per_week)} hrs/wk saved`;

  return (
    <div className="px-6 md:px-12 py-12 md:py-20 max-w-5xl">
      <PageHeading title="Every task we do" subtitle={subtitle} />
      {departments.map((d) => (
        <TasksDepartmentSection
          key={d.slug}
          slug={d.slug}
          name={d.name}
          tasksAutomated={d.tasks_automated}
          tasksTotal={d.tasks_total}
          tasks={d.tasks}
        />
      ))}
    </div>
  );
}
