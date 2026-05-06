export type DeptSlug =
  | "sales"
  | "consulting"
  | "marketing"
  | "product"
  | "dev"
  | "finance"
  | "relationships"
  | "company"
  | "cross-cutting";

export type AutomationStatus = "live" | "building" | "queued" | "killed";

export interface Automation {
  name: string;
  skill: string;
  status: AutomationStatus;
  hours_per_week: number;
  description: string;
}

export interface Department {
  slug: DeptSlug;
  name: string;
  automations_live: number;
  tasks_automated: number;
  tasks_total: number;
  hours_saved_per_week: number;
  automations: Automation[];
}

export interface ComingNextItem {
  name: string;
  department: DeptSlug;
  leverage: "S" | "M" | "L";
  status: "backlog" | "spec'd" | "building";
}

export interface InstanceMeta {
  name: string;
  owner?: string;
  tagline?: string;
  logo_text: string;
  primary_color: string;
  text_color: string;
  background_color: string;
}

export interface DashboardData {
  $schema_version: string;
  generated_at: string;
  instance: InstanceMeta;
  stats: {
    hours_saved_per_week: number;
    automations_live: number;
    tasks_automated: number;
    tasks_total: number;
  };
  departments: Department[];
  coming_next: ComingNextItem[];
}

export type TaskStatus = "done" | "queued" | "todo";
export type TaskImportance = "high" | "medium" | "low";

export interface Task {
  name: string;
  hours_per_week: number;
  automated_by: string | null;
  importance: TaskImportance;
  queued: boolean;
  status: TaskStatus;
}

export interface TasksDepartment {
  slug: DeptSlug;
  name: string;
  tasks_automated: number;
  tasks_total: number;
  tasks: Task[];
}

export interface TasksData {
  $schema_version: string;
  generated_at: string;
  instance: InstanceMeta;
  stats: {
    tasks_automated: number;
    tasks_total: number;
    hours_saved_per_week: number;
    tasks_by_status: { done: number; queued: number; todo: number };
  };
  departments: TasksDepartment[];
}
