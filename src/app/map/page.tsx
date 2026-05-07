import { loadDashboard, loadTasks } from "@/lib/data";
import { MindMap } from "@/components/MindMap";

export const metadata = {
  title: "Minimise — Automation Map",
  description: "Force-directed graph of every department, automation, queued item, and manual task in Minimise's AI-Operating-System.",
};

export default async function MapPage() {
  const [data, tasksData] = await Promise.all([loadDashboard(), loadTasks()]);
  return (
    <div className="px-6 md:px-12 py-10">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-ink-muted mb-8 text-center">
          Automation ecosystem
        </p>
        <MindMap data={data} tasksData={tasksData} />
      </div>
    </div>
  );
}
