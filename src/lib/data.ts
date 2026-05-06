import { promises as fs } from "node:fs";
import path from "node:path";
import type { DashboardData, TasksData } from "@/types/dashboard";

export async function loadDashboard(): Promise<DashboardData> {
  const file = path.join(process.cwd(), "public/data/dashboard.json");
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

export async function loadTasks(): Promise<TasksData> {
  const file = path.join(process.cwd(), "public/data/tasks.json");
  return JSON.parse(await fs.readFile(file, "utf-8"));
}
