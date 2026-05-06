import { loadDashboard } from "@/lib/data";
import { MindMap } from "@/components/MindMap";

export const metadata = {
  title: "Minimise — Automation Map",
  description: "Radial map of every department and automation in Minimise's AI-Operating-System.",
};

export default async function MapPage() {
  const data = await loadDashboard();
  return (
    <div className="px-6 md:px-12 py-10">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-ink-muted mb-8 text-center">
          Automation ecosystem
        </p>
        <MindMap data={data} />
      </div>
    </div>
  );
}
