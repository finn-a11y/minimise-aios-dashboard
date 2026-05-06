import type { Department } from "@/types/dashboard";
import { DepartmentCard } from "./DepartmentCard";

type DepartmentGridProps = { departments: Department[] };

export function DepartmentGrid({ departments }: DepartmentGridProps) {
  return (
    <section className="px-6 md:px-12 mb-24">
      <h2 className="text-xs uppercase tracking-widest text-ink-muted mb-8">
        Departments
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
        {departments.map((d) => (
          <DepartmentCard
            key={d.slug}
            slug={d.slug}
            name={d.name}
            automationsLive={d.automations_live}
            tasksAutomated={d.tasks_automated}
            tasksTotal={d.tasks_total}
            hoursSavedPerWeek={d.hours_saved_per_week}
            automations={d.automations}
          />
        ))}
      </div>
    </section>
  );
}
