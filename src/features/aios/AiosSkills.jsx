import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sparkline from '../../components/Sparkline';
import { useSkillsData } from '../../hooks/useSkillsData';
import { StatusPill, TriggerPill, EmptyIconRow } from './pills';
import { fmtHours, fmtRelativeTime } from './format';
import { MagnifyingGlass, Stack, Pulse } from '../../components/icons';

/**
 * AiosSkills — skill → task view.
 *
 * Layout:
 *   - Filter bar: dept · status · trigger · search
 *   - Skill cards grouped by department (3-col desktop, 1-col mobile)
 *   - Below grid: most-recent 50 execution activity log
 */

const STATUS_OPTIONS = ['all', 'live', 'building', 'queued', 'killed'];
const TRIGGER_OPTIONS = ['all', 'manual', 'scheduled', 'event'];
const CHIP_LIMIT = 3;

export default function AiosSkills() {
  const { data, isLoading, error } = useSkillsData();

  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    trigger: 'all',
    search: '',
  });

  const grouped = useMemo(() => {
    if (!data) return [];
    const { skills, departments } = data;

    const search = filters.search.trim().toLowerCase();
    const filtered = skills.filter(s => {
      if (filters.department !== 'all' && s.department_slug !== filters.department) return false;
      if (filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.trigger !== 'all' && s.mode !== filters.trigger) return false;
      if (search) {
        const hay = `${s.display_name} ${s.slug} ${s.description || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    const result = [];
    for (const dept of departments) {
      const deptSkills = filtered.filter(s => s.department_id === dept.id);
      if (deptSkills.length) result.push({ id: dept.id, name: dept.name, slug: dept.slug, skills: deptSkills });
    }
    // Skills without a department.
    const orphans = filtered.filter(s => !departments.find(d => d.id === s.department_id));
    if (orphans.length) result.push({ id: 'unassigned', name: 'Unassigned', skills: orphans });
    return result;
  }, [data, filters]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError error={error} />;
  if (!data) return null;

  const totalShown = grouped.reduce((a, g) => a + g.skills.length, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Skills
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          The catalog of skills. {totalShown} of {data.skills.length} shown. Click any card to drill in.
        </p>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} departments={data.departments} />

      {totalShown === 0 ? (
        <div className="card p-6">
          <EmptyIconRow icon={Stack} label="No skills match those filters." />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(g => (
            <section key={g.id}>
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {g.name}{' '}
                <span className="text-[11px] font-normal" style={{ color: 'var(--text-tertiary)' }}>
                  {g.skills.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.skills.map(s => <SkillCard key={s.id} skill={s} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Activity log</h2>
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Most recent {data.activity.length} executions
          </span>
        </div>
        <ActivityLog activity={data.activity} />
      </section>
    </div>
  );
}

function FilterBar({ filters, setFilters, departments }) {
  const update = (patch) => setFilters(f => ({ ...f, ...patch }));
  return (
    <div className="card p-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <input
          className="input pl-9"
          placeholder="Search skills..."
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
        />
      </div>
      <Select
        value={filters.department}
        onChange={v => update({ department: v })}
        options={[{ value: 'all', label: 'All departments' }, ...departments.map(d => ({ value: d.slug, label: d.name }))]}
      />
      <Select
        value={filters.status}
        onChange={v => update({ status: v })}
        options={STATUS_OPTIONS.map(s => ({ value: s, label: s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1) }))}
      />
      <Select
        value={filters.trigger}
        onChange={v => update({ trigger: v })}
        options={TRIGGER_OPTIONS.map(t => ({ value: t, label: t === 'all' ? 'All triggers' : t.charAt(0).toUpperCase() + t.slice(1) }))}
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
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function SkillCard({ skill, hideDepartment = false }) {
  const visibleTasks = skill.tasks_covered.slice(0, CHIP_LIMIT);
  const overflow = Math.max(skill.tasks_covered.length - visibleTasks.length, 0);

  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="card-interactive p-5 flex flex-col gap-3 min-h-[210px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {skill.display_name}
          </h3>
          {!hideDepartment && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {skill.department_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusPill status={skill.status} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <TriggerPill mode={skill.mode} />
      </div>

      {skill.description && (
        <p className="text-[12px] line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {skill.description}
        </p>
      )}

      {/* Covered tasks chips */}
      {skill.tasks_covered.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleTasks.map(t => (
            <Link
              key={t.id}
              to={`/tasks`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-md"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              {t.short_name || t.name}
            </Link>
          ))}
          {overflow > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-md"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
            >
              +{overflow} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Not yet wired to any tracked task.
        </p>
      )}

      <div className="mt-auto pt-2 grid grid-cols-2 gap-2 items-end">
        <div>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Last 7d</p>
          {skill.ever_ran ? (
            <p className="text-[18px] font-bold tabular-nums leading-none mt-1" style={{ color: 'var(--text-primary)' }}>
              {skill.last_7d_executions}
              <span className="text-[11px] font-medium ml-1" style={{ color: 'var(--text-tertiary)' }}>
                runs
              </span>
            </p>
          ) : (
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Never run</p>
          )}
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {skill.last_7d_hours_saved > 0 ? `${fmtHours(skill.last_7d_hours_saved)} saved` : ' '}
          </p>
        </div>
        <div className="min-w-0">
          {skill.sparkline.some(v => v > 0) ? (
            <Sparkline data={skill.sparkline} height={32} showArea />
          ) : (
            <div className="h-8 flex items-end justify-end pr-1">
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          All time: {skill.all_time_executions} runs · {fmtHours(skill.all_time_hours_saved)}
        </span>
        <OperatorStack operators={skill.operators} />
      </div>
    </Link>
  );
}

function OperatorStack({ operators }) {
  if (!operators?.length) return null;
  const visible = operators.slice(0, 3);
  const overflow = operators.length - visible.length;
  return (
    <div className="flex -space-x-1">
      {visible.map(op => (
        <div
          key={op}
          title={op}
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            border: '1px solid var(--bg-card)',
          }}
        >
          {op.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--bg-card)',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

function ActivityLog({ activity }) {
  if (!activity.length) {
    return (
      <div className="card p-6">
        <EmptyIconRow icon={Pulse} label="No runs yet." hint="The activity log updates live the moment a skill executes." />
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="hidden md:grid items-center gap-3 px-4 py-2 text-[11px] font-medium tracking-wide"
        style={{
          color: 'var(--text-tertiary)',
          gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr 80px 80px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span>Skill</span>
        <span>Operator</span>
        <span>When</span>
        <span className="text-right">Status</span>
        <span className="text-right">Units</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {activity.map(e => (
          <div key={e.id} className="grid items-center gap-3 px-4 py-2 row-hover"
            style={{ gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr 80px 80px' }}
          >
            <Link
              to={e.skill_slug ? `/skills/${e.skill_slug}` : '/skills'}
              className="text-sm font-medium truncate hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              {e.skill_display_name}
            </Link>
            <span className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{e.operator || 'unknown'}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{fmtRelativeTime(e.started_at)}</span>
            <span className="text-right">
              <StatusPill status={e.status === 'completed' ? 'live' : e.status === 'failed' ? 'killed' : 'building'} />
            </span>
            <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
              {e.units_processed ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading skills...</span>
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-negative)' }}>Failed to load skills.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error?.message}</p>
      </div>
    </div>
  );
}
