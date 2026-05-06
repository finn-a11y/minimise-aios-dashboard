import { loadDashboard } from "@/lib/data";
import { Hero } from "@/components/Hero";
import { DepartmentGrid } from "@/components/DepartmentGrid";
import { ComingNext } from "@/components/ComingNext";

export default async function HomePage() {
  const data = await loadDashboard();

  return (
    <>
      <Hero
        hoursSavedPerWeek={data.stats.hours_saved_per_week}
        automationsLive={data.stats.automations_live}
        tasksAutomated={data.stats.tasks_automated}
        tasksTotal={data.stats.tasks_total}
        tagline={data.instance.tagline ?? data.instance.name}
      />
      <DepartmentGrid departments={data.departments} />
      <ComingNext items={data.coming_next} />
    </>
  );
}
