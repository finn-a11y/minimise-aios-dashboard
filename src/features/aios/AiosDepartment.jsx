import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import KPICard from '../../components/KPICard';
import { useDepartmentData } from '../../hooks/useDepartmentData';
import { SkillCard } from './AiosSkills';
import { StatusPill, TriggerPill, SkillChip, EmptyIconRow } from './pills';
import { fmtMinutes, fmtHours, fmtRelativeTime } from './format';
import { ArrowLeft, Pulse, Stack, Checks } from '../../components/icons';

export default function AiosDepartment() {
  const { slug } = useParams();
  const { data, isLoading, error } = useDepartmentData(slug);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError error={error} />;
  if (!data) return null;
  if (!data.department) return <NotFound slug={slug} />;

  const {
    department,
    skills,
    tasks,
    categories,
    recentExecutions,
    heroHoursWeek,
    heroExecutionsWeek,
  } = data;

  const automatedCount = tasks.filter(t => t.status === 'live').length;
  const manualCount = tasks.filter(t => t.status !== 'live').length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[12px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft size={12} />
        Overview
      </Link>

      <header>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {department.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {tasks.length} tasks · {skills.length} skill{skills.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          prominent
          title="Hours saved this week"
          value={heroHoursWeek > 0 ? fmtHours(heroHoursWeek) : '—'}
          baseline={heroHoursWeek > 0 ? `${heroExecutionsWeek} runs in the dept` : 'Awaiting first run'}
          baselineLabel=""
        />
        <KPICard
          title="Tasks automated"
          value={`${automatedCount} / ${tasks.length}`}
          baseline={`${tasks.length > 0 ? Math.round((automatedCount / tasks.length) * 100) : 0}% of dept tasks`}
          baselineLabel=""
        />
        <KPICard
          title="Tasks still manual"
          value={`${manualCount}`}
          baseline={manualCount === 0 ? 'Fully automated!' : `${tasks.length > 0 ? Math.round((manualCount / tasks.length) * 100) : 0}% to go`}
          baselineLabel=""
        />
      </div>

      <section>
        <SectionHeader title="Skills in this department" hint={`${skills.length}`} />
        {skills.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={Stack} label="No skills here yet." hint="When a skill lands in this department, it'll show up here." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(s => <SkillCard key={s.id} skill={s} hideDepartment />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Tasks" hint={`${tasks.length}`} />
        {tasks.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={Checks} label="No tasks mapped to this department yet." />
          </div>
        ) : (
          <TaskTable tasks={tasks} categories={categories} />
        )}
      </section>

      <section>
        <SectionHeader title="Recent runs" hint="Last 15 scoped to this department." />
        {recentExecutions.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={Pulse} label="No runs in this department yet." hint="Once a skill in this dept fires, the run appears here live." />
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {recentExecutions.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 row-hover">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusPill status={e.status === 'completed' ? 'live' : e.status === 'failed' ? 'killed' : 'building'} />
                  <div className="min-w-0">
                    <Link
                      to={e.skill_slug ? `/skills/${e.skill_slug}` : '/skills'}
                      className="text-sm font-medium truncate block hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {e.skill_display_name}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{e.operator || 'unknown'}</span>
                      <span>·</span>
                      <span>{fmtRelativeTime(e.started_at)}</span>
                      {e.duration_seconds != null && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(e.duration_seconds)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskTable({ tasks, categories }) {
  // Group tasks by category for visual order — mirrors /tasks.
  const grouped = useMemo(() => {
    const out = [];
    for (const cat of categories) {
      const ts = tasks.filter(t => t.category_id === cat.id);
      if (ts.length) out.push({ id: cat.id, name: cat.name, tasks: ts });
    }
    const uncategorised = tasks.filter(t => !t.category_id || !categories.find(c => c.id === t.category_id));
    if (uncategorised.length) out.push({ id: 'uncat', name: 'Uncategorised', tasks: uncategorised });
    return out;
  }, [tasks, categories]);

  return (
    <div className="space-y-4">
      {grouped.map(g => (
        <div key={g.id}>
          <div className="flex items-center gap-2 mb-2 pl-1">
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{g.name}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{g.tasks.length}</span>
          </div>
          <div className="card overflow-hidden">
            <div className="hidden md:grid items-center gap-3 px-4 py-2 text-[11px] font-medium tracking-wide"
              style={{
                color: 'var(--text-tertiary)',
                gridTemplateColumns: 'minmax(0, 2fr) 80px 1.5fr 1fr 64px 64px 80px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>Task</span>
              <span>Status</span>
              <span>Skill</span>
              <span>Trigger</span>
              <span className="text-right">Manual</span>
              <span className="text-right">Auto</span>
              <span className="text-right">Hrs/wk</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {g.tasks.map(t => {
                const isManual = t.status === 'manual';
                return (
                  <div
                    key={t.id}
                    className="grid items-center gap-3 px-4 py-3 row-hover"
                    style={{
                      gridTemplateColumns: 'minmax(0, 2fr) 80px 1.5fr 1fr 64px 64px 80px',
                      ...(isManual ? { borderTop: '1px dashed var(--border-default)' } : null),
                    }}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: isManual ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {t.name}
                    </p>
                    <div><StatusPill status={t.status} /></div>
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {t.automating_skills.length > 0
                        ? t.automating_skills.map(s => <SkillChip key={s.id} skill={s} />)
                        : <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
                      }
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {t.triggers.length > 0
                        ? Array.from(new Set(t.triggers)).map(tr => <TriggerPill key={tr} mode={tr} />)
                        : <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
                      }
                    </div>
                    <span className="text-[12px] tabular-nums text-right" style={{ color: isManual ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                      {isManual ? '—' : fmtMinutes(t.manual_minutes)}
                    </span>
                    <span className="text-[12px] tabular-nums text-right" style={{ color: isManual ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                      {isManual ? '—' : fmtMinutes(t.automated_minutes)}
                    </span>
                    <span className="text-[12px] tabular-nums text-right font-semibold"
                      style={{ color: t.hours_saved_last_7d > 0 ? 'var(--color-positive)' : 'var(--text-tertiary)' }}
                    >
                      {t.hours_saved_last_7d > 0 ? fmtHours(t.hours_saved_last_7d) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {hint && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{hint}</span>}
    </div>
  );
}

function formatDuration(seconds) {
  const n = Number(seconds);
  if (!isFinite(n)) return '—';
  if (n < 60) return `${Math.round(n)}s`;
  return `${(n / 60).toFixed(1)}m`;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading department...</span>
      </div>
    </div>
  );
}

function NotFound({ slug }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Department not found.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          No department with slug <span className="font-mono">{slug}</span> for this tenant.
        </p>
        <Link to="/" className="text-xs underline mt-2 inline-block" style={{ color: 'var(--brand-primary)' }}>
          Back to overview
        </Link>
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-negative)' }}>Failed to load department.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error?.message}</p>
      </div>
    </div>
  );
}
