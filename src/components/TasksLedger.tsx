"use client";

import { useState, useMemo } from "react";
import type { TasksData, TaskStatus, TaskImportance, AutomationMode } from "@/types/dashboard";
import { PageHeading } from "./PageHeading";
import { TasksDepartmentSection } from "./TasksDepartmentSection";
import { formatHours } from "@/lib/format";

type TasksLedgerProps = { tasksData: TasksData };

const ALL = "all" as const;

type DeptFilter = string; // dept slug or "all"
type ImportanceFilter = TaskImportance | typeof ALL;
type StatusFilter = TaskStatus | typeof ALL;
type ModeFilter = AutomationMode | typeof ALL;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-muted select-none">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-neutral-200 rounded text-sm text-ink bg-white px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent cursor-pointer min-w-[140px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TasksLedger({ tasksData }: TasksLedgerProps) {
  const { stats, departments } = tasksData;

  const [deptFilter, setDeptFilter] = useState<DeptFilter>(ALL);
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>(ALL);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL);
  const [modeFilter, setModeFilter] = useState<ModeFilter>(ALL);

  // Build dept options from the JSON — preserves rendering order
  const deptOptions = useMemo(
    () => [
      { value: ALL, label: "All departments" },
      ...departments.map((d) => ({ value: d.slug, label: d.name })),
    ],
    [departments]
  );

  const importanceOptions: { value: ImportanceFilter; label: string }[] = [
    { value: ALL, label: "All importance" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: ALL, label: "All status" },
    { value: "done", label: "Done" },
    { value: "todo", label: "To-do" },
    { value: "queued", label: "Queued" },
  ];

  const modeOptions: { value: ModeFilter; label: string }[] = [
    { value: ALL, label: "All modes" },
    { value: "manual", label: "Manual" },
    { value: "scheduled", label: "Scheduled" },
    { value: "event", label: "Event" },
  ];

  // Apply filters to departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((d) => deptFilter === ALL || d.slug === deptFilter)
      .map((d) => {
        const filteredTasks = d.tasks.filter((t) => {
          if (importanceFilter !== ALL && t.importance !== importanceFilter) return false;
          if (statusFilter !== ALL && t.status !== statusFilter) return false;
          // mode filter: exclude tasks with no mode (null/undefined) when a specific mode is selected
          if (modeFilter !== ALL && (t.mode == null || t.mode !== modeFilter)) return false;
          return true;
        });
        return { ...d, tasks: filteredTasks };
      })
      .filter((d) => d.tasks.length > 0);
  }, [departments, deptFilter, importanceFilter, statusFilter, modeFilter]);

  // Dynamic stat line based on filtered tasks
  const filteredStats = useMemo(() => {
    let automated = 0;
    let total = 0;
    let hours = 0;
    for (const d of filteredDepartments) {
      for (const t of d.tasks) {
        total++;
        if (t.automated_by.length > 0) {
          automated++;
          // v0.2: prefer hours_saved_per_week; fall back to legacy hours_per_week
          const saved =
            t.hours_saved_per_week ??
            (typeof t.hours_per_week === "number" ? t.hours_per_week : 0);
          hours += saved;
        }
      }
    }
    return { automated, total, hours };
  }, [filteredDepartments]);

  const isFiltered =
    deptFilter !== ALL || importanceFilter !== ALL || statusFilter !== ALL || modeFilter !== ALL;

  const subtitle = isFiltered
    ? `${filteredStats.automated} of ${filteredStats.total} automated · ${formatHours(filteredStats.hours)} hrs/wk saved (filtered)`
    : `${stats.tasks_automated} of ${stats.tasks_total} automated · ${formatHours(stats.hours_saved_per_week)} hrs/wk saved`;

  return (
    <div className="px-6 md:px-12 py-12 md:py-20 max-w-5xl">
      <PageHeading title="Every task we do" subtitle={subtitle} />

      {/* Filter row */}
      <div className="flex flex-wrap gap-4 mb-10">
        <FilterSelect
          label="Department"
          value={deptFilter}
          options={deptOptions}
          onChange={setDeptFilter}
        />
        <FilterSelect
          label="Importance"
          value={importanceFilter}
          options={importanceOptions}
          onChange={(v) => setImportanceFilter(v as ImportanceFilter)}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={statusOptions}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <FilterSelect
          label="Mode"
          value={modeFilter}
          options={modeOptions}
          onChange={(v) => setModeFilter(v as ModeFilter)}
        />
      </div>

      {filteredDepartments.length === 0 ? (
        <p className="text-ink-muted text-sm mt-8">No tasks match the selected filters.</p>
      ) : (
        filteredDepartments.map((d) => (
          <TasksDepartmentSection
            key={d.slug}
            slug={d.slug}
            name={d.name}
            tasksAutomated={d.tasks_automated}
            tasksTotal={d.tasks_total}
            tasks={d.tasks}
          />
        ))
      )}
    </div>
  );
}
