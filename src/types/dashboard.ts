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
export type AutomationMode = "manual" | "scheduled" | "event";

export interface Task {
  name: string;
  short_name?: string; // 1-3 word label for mind map circles (≤ 18 chars); falls back to name if absent
  hours_per_week?: number | null; // legacy — kept permissive; v0.2 sync replaces with manual/automated pair
  // v0.3 schema: automated_by is now a list of skill slugs (empty list = no automation)
  automated_by: string[];
  importance: TaskImportance;
  queued: boolean;
  status: TaskStatus;
  // v0.2 fields — primary mode (highest priority across all skills in automated_by)
  mode?: AutomationMode | null;
  // v0.3 field — one mode string per skill in automated_by
  modes?: AutomationMode[];
  manual_hours_per_week?: number | null;
  automated_hours_per_week?: number | null;
  hours_saved_per_week?: number | null;
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
