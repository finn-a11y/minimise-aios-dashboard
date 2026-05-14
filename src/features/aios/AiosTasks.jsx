import React, { useMemo, useState } from 'react';
import { useTasksData } from '../../hooks/useTasksData';
import { StatusPill, TriggerPill, SkillChip, EmptyIconRow } from './pills';
import { fmtMinutes, fmtHours } from './format';
import { CaretDown, CaretRight, MagnifyingGlass, Checks } from '../../components/icons';

/**
 * AiosTasks — task → skill view.
 *
 * Layout:
 *   - Filter bar: dept · category · status · trigger · search
 *   - Grouped by dept × category (display_order). Each group is collapsible
 *     (expanded by default).
 *   - Per row: name · status pill · automating skill chip(s) · trigger pill ·
 *     manual min · automated min · runs/wk · hrs/wk
 *   - Manual rows: dashed border, grey status pill, time cols "—"
 */

const STATUS_OPTIONS = ['all', 'live', 'queued', 'manual'];
const TRIGGER_OPTIONS = ['all', 'manual', 'scheduled', 'event'];

export default function AiosTasks() {
  const { data, isLoading, error } = useTasksData();

  const [filters, setFilters] = useState({
    department: 'all',
    category: 'all',
    status: 'all',
    trigger: 'all',
    search: '',
  });

  // Group by dept × category, respecting display_order.
  const grouped = useMemo(() => {
    if (!data) return [];
    const { tasks, departments, categories } = data;

    // Apply filters first.
    const search = filters.search.trim().toLowerCase();
    const filtered = tasks.filter(t => {
      if (filters.department !== 'all' && t.department_slug !== filters.department) return false;
      if (filters.category !== 'all' && t.category_id !== filters.category) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.trigger !== 'all') {
        if (!t.triggers.includes(filters.trigger)) return false;
      }
      if (search) {
        const hay = `${t.name} ${t.short_name || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    // Build dept → category → tasks structure.
    const result = [];
    for (const dept of departments) {
      const deptTasks = filtered.filter(t => t.department_id === dept.id);
      if (!deptTasks.length) continue;
      const deptCategories = categories.filter(c => c.department_id === dept.id);
      // Tasks without a category bucket into "Uncategorised".
      const cats = [];
      for (const cat of deptCategories) {
        const catTasks = deptTasks.filter(t => t.category_id === cat.id);
        if (catTasks.length) cats.push({ id: cat.id, name: cat.name, tasks: catTasks });
      }
      const uncategorised = deptTasks.filter(t => !t.category_id || !deptCategories.find(c => c.id === t.category_id));
      if (uncategorised.length) cats.push({ id: `${dept.id}-uncat`, name: 'Uncategorised', tasks: uncategorised });
      if (cats.length) result.push({ id: dept.id, name: dept.name, slug: dept.slug, categories: cats });
    }
    return result;
  }, [data, filters]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError error={error} />;
  if (!data) return null;

  const totalShown = grouped.reduce(
    (acc, g) => acc + g.categories.reduce((a, c) => a + c.tasks.length, 0),
    0
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Tasks
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Every task the company runs. {totalShown} of {data.tasks.length} shown.
        </p>
      </header>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        departments={data.departments}
        categories={data.categories}
      />

      {totalShown === 0 ? (
        <div className="card p-6">
          <EmptyIconRow icon={Checks} label="No tasks match those filters." />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(dept => (
            <DepartmentGroup key={dept.id} dept={dept} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar({ filters, setFilters, departments, categories }) {
  // Categories filtered by selected dept (if any).
  const filteredCategories = filters.department === 'all'
    ? categories
    : categories.filter(c => {
      const dept = departments.find(d => d.id === c.department_id);
      return dept?.slug === filters.department;
    });

  const update = (patch) => setFilters(f => ({ ...f, ...patch }));

  return (
    <div className="card p-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <input
          className="input pl-9"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
        />
      </div>
      <Select
        value={filters.department}
        onChange={v => update({ department: v, category: 'all' })}
        options={[{ value: 'all', label: 'All departments' }, ...departments.map(d => ({ value: d.slug, label: d.name }))]}
      />
      <Select
        value={filters.category}
        onChange={v => update({ category: v })}
        options={[{ value: 'all', label: 'All categories' }, ...filteredCategories.map(c => ({ value: c.id, label: c.name }))]}
      />
      <Select
        value={filters.status}
        onChange={v => update({ status: v })}
        options={STATUS_OPTIONS.map(s => ({ value: s, label: s === 'all' ? 'All statuses' : capitalize(s) }))}
      />
      <Select
        value={filters.trigger}
        onChange={v => update({ trigger: v })}
        options={TRIGGER_OPTIONS.map(t => ({ value: t, label: t === 'all' ? 'All triggers' : capitalize(t) }))}
      />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input"
      style={{ minWidth: 140, paddingRight: 24 }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function DepartmentGroup({ dept }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 mb-3"
      >
        {open ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
        <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {dept.name}
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {dept.categories.reduce((a, c) => a + c.tasks.length, 0)} tasks
        </span>
      </button>
      {open && (
        <div className="space-y-4">
          {dept.categories.map(cat => (
            <CategoryTable key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryTable({ category }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 pl-1">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {category.name}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{category.tasks.length}</span>
      </div>
      <div className="card overflow-hidden">
        <div className="hidden md:grid items-center gap-3 px-4 py-2 text-[11px] font-medium tracking-wide"
          style={{
            color: 'var(--text-tertiary)',
            gridTemplateColumns: 'minmax(0, 2.5fr) 80px 1.5fr 1fr 64px 64px 64px 80px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span>Task</span>
          <span>Status</span>
          <span>Skill</span>
          <span>Trigger</span>
          <span className="text-right">Manual</span>
          <span className="text-right">Auto</span>
          <span className="text-right">Runs/wk</span>
          <span className="text-right">Hrs/wk</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {category.tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isManual = task.status === 'manual';
  return (
    <div
      className="grid items-center gap-3 px-4 py-3 row-hover"
      style={{
        gridTemplateColumns: 'minmax(0, 2.5fr) 80px 1.5fr 1fr 64px 64px 64px 80px',
        // Dashed-border treatment for manual rows = a subtle inset top dashed line.
        ...(isManual ? { borderTop: '1px dashed var(--border-default)' } : null),
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: isManual ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
          {task.name}
        </p>
        {task.short_name && task.short_name !== task.name && (
          <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{task.short_name}</p>
        )}
      </div>
      <div><StatusPill status={task.status} /></div>
      <div className="flex flex-wrap gap-1 min-w-0">
        {task.automating_skills.length > 0
          ? task.automating_skills.map(s => <SkillChip key={s.id} skill={s} />)
          : <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
        }
      </div>
      <div className="flex flex-wrap gap-1">
        {task.triggers.length > 0
          ? Array.from(new Set(task.triggers)).map(t => <TriggerPill key={t} mode={t} />)
          : <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
        }
      </div>
      <span className="text-[12px] tabular-nums text-right" style={{ color: isManual ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
        {isManual ? '—' : fmtMinutes(task.manual_minutes)}
      </span>
      <span className="text-[12px] tabular-nums text-right" style={{ color: isManual ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
        {isManual ? '—' : fmtMinutes(task.automated_minutes)}
      </span>
      <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
        {task.runs_per_week > 0 ? task.runs_per_week : '—'}
      </span>
      <span className="text-[12px] tabular-nums text-right font-semibold" style={{ color: task.hours_saved_last_7d > 0 ? 'var(--color-positive)' : 'var(--text-tertiary)' }}>
        {task.hours_saved_last_7d > 0 ? fmtHours(task.hours_saved_last_7d) : '—'}
      </span>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading tasks...</span>
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-negative)' }}>Failed to load tasks.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error?.message}</p>
      </div>
    </div>
  );
}
