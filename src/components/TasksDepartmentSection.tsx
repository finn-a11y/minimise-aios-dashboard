import type { TaskCategory } from "@/types/dashboard";
import { CategorySection } from "./CategorySection";

type TasksDepartmentSectionProps = {
  slug: string;
  name: string;
  tasksAutomated: number;
  tasksTotal: number;
  categories: TaskCategory[];
};

/** Department-level wrapper. v3 shape: tasks live under categories under each
 *  department. Empty categories are dropped by the build script and defensively
 *  skipped here too (CategorySection returns null when its tasks list is empty). */
export function TasksDepartmentSection({
  slug,
  name,
  tasksAutomated,
  tasksTotal,
  categories,
}: TasksDepartmentSectionProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mb-12">
      <header className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-ink">{name}</h2>
        <span className="text-sm text-ink-muted">
          {tasksAutomated}/{tasksTotal} automated
        </span>
      </header>
      <div className="border-t border-line pt-2">
        {categories.map((c) => (
          <CategorySection
            key={`${slug}-${c.name}`}
            deptSlug={slug}
            name={c.name}
            tasksAutomated={c.tasks_automated}
            tasksTotal={c.tasks_total}
            hoursSavedPerWeek={c.hours_saved_per_week}
            tasks={c.tasks}
          />
        ))}
      </div>
    </section>
  );
}
