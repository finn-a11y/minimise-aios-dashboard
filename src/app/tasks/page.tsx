import { loadTasks } from "@/lib/data";
import { TasksLedger } from "@/components/TasksLedger";

export default async function TasksPage() {
  const data = await loadTasks();
  return <TasksLedger tasksData={data} />;
}
