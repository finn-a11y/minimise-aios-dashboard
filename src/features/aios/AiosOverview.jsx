import React from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../../components/KPICard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { EmptyIconRow } from './pills';
import { fmtHours, fmtRelativeTime } from './format';
import { ArrowRight, Sparkle, Pulse } from '../../components/icons';

/**
 * AiosOverview — the screenshot moment.
 *
 * Layout (top to bottom):
 *   1. HERO KPICard at `prominent` size — "Hours saved this week" + delta
 *      vs last week + 7-day sparkline. Sub-line shows cumulative since day 1.
 *   2. 3-up secondary KPIs: skills live · tasks automated · tasks still manual.
 *   3. Department grid (3x2) — 6 dept cards.
 *   4. "Coming next" strip — 3 rows from coming_next.
 *   5. Recent runs activity feed — last 10 skill_executions.
 *
 * Empty states are explicit: if the tenant has zero executions, the hero
 * + activity feed render the "just getting started" copy.
 */

export default function AiosOverview() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) return <PageLoader />;
  if (error) return <PageError error={error} />;
  if (!data) return null;

  const {
    skillsLive,
    skillsTotal,
    tasksAutomated,
    tasksManual,
    tasksTotal,
    hoursSavedWeek,
    hoursSavedAllTime,
    heroDeltaPct,
    heroSparkline,
    departments,
    comingNext,
    recentExecutions,
    hasAnyExecutions,
  } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Live view of every skill, task, and run across the AIOS.
        </p>
      </header>

      <HeroCard
        hasAnyExecutions={hasAnyExecutions}
        hoursSavedWeek={hoursSavedWeek}
        hoursSavedAllTime={hoursSavedAllTime}
        heroDeltaPct={heroDeltaPct}
        heroSparkline={heroSparkline}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Skills live"
          value={`${skillsLive}`}
          baseline={`${skillsTotal} total`}
          baselineLabel=""
        />
        <KPICard
          title="Tasks automated"
          value={`${tasksAutomated} / ${tasksTotal}`}
          baseline={`${tasksTotal > 0 ? Math.round((tasksAutomated / tasksTotal) * 100) : 0}% of mapped tasks`}
          baselineLabel=""
        >
          <ProgressBar value={tasksAutomated} total={tasksTotal} />
        </KPICard>
        <KPICard
          title="Tasks still manual"
          value={`${tasksManual}`}
          baseline={`${tasksTotal > 0 ? Math.round((tasksManual / tasksTotal) * 100) : 0}% to go`}
          baselineLabel=""
        >
          <ProgressBar value={tasksManual} total={tasksTotal} variant="muted" />
        </KPICard>
      </div>

      <section>
        <SectionHeader title="By department" hint="Click a department to drill in." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <Link key={dept.id} to={`/department/${dept.slug}`} className="block">
              <KPICard
                title={dept.name}
                value={dept.hours_saved_week > 0 ? fmtHours(dept.hours_saved_week) : '—'}
                baseline={`${dept.tasks_automated} / ${dept.tasks_total} tasks automated`}
                baselineLabel=""
                onClick={() => {}}
              >
                {dept.hours_saved_week <= 0 && (
                  <span className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Awaiting first run
                  </span>
                )}
              </KPICard>
            </Link>
          ))}
        </div>
      </section>

      <ComingNextStrip comingNext={comingNext} />

      <section>
        <SectionHeader title="Recent runs" hint="Last 10 skill executions across all departments." />
        <ActivityFeed executions={recentExecutions} hasAnyExecutions={hasAnyExecutions} />
      </section>
    </div>
  );
}

function HeroCard({ hasAnyExecutions, hoursSavedWeek, hoursSavedAllTime, heroDeltaPct, heroSparkline }) {
  if (!hasAnyExecutions) {
    return (
      <div className="card p-6 sm:p-8">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkle size={28} />
          </div>
          <p className="empty-state-text">Just getting started.</p>
          <p className="empty-state-hint">Your first skill run will land here.</p>
        </div>
      </div>
    );
  }

  const trend = heroDeltaPct == null ? 'up' : (heroDeltaPct >= 0 ? 'up' : 'down');
  return (
    <KPICard
      prominent
      title="Hours saved this week"
      value={fmtHours(hoursSavedWeek)}
      delta={heroDeltaPct == null ? null : Math.abs(heroDeltaPct)}
      deltaType="percent"
      trend={trend}
      sparklineData={heroSparkline}
    >
      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {fmtHours(hoursSavedAllTime)}
        </span>{' '}
        saved since day 1
      </div>
    </KPICard>
  );
}

function ProgressBar({ value, total, variant = 'positive' }) {
  const pct = total > 0 ? Math.min(Math.max((value / total) * 100, 0), 100) : 0;
  const color = variant === 'positive' ? 'var(--color-positive)' : 'var(--text-tertiary)';
  return (
    <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
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

function ComingNextStrip({ comingNext }) {
  return (
    <section>
      <SectionHeader title="Coming next" hint="Top-leverage automations queued for build." />
      <div className="card divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {comingNext.length === 0 ? (
          <div className="p-6">
            <EmptyIconRow label="No queued items" hint="The roadmap will surface here as it lands." />
          </div>
        ) : (
          comingNext.map(item => (
            <Link
              key={item.id}
              to="/tasks"
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors row-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="badge badge-warning shrink-0">Queued</span>
                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.task_name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.department_name && (
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.department_name}
                  </span>
                )}
                <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function ActivityFeed({ executions, hasAnyExecutions }) {
  if (!hasAnyExecutions || executions.length === 0) {
    return (
      <div className="card p-6">
        <EmptyIconRow
          icon={Pulse}
          label="No runs yet."
          hint="The dashboard updates live the moment a skill executes."
        />
      </div>
    );
  }
  return (
    <div className="card divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
      {executions.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 row-hover">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`badge ${e.status === 'completed' ? 'badge-positive' : e.status === 'failed' ? 'badge-negative' : 'badge-neutral'} shrink-0`}>
              {e.status === 'completed' ? 'OK' : e.status === 'failed' ? 'Fail' : e.status}
            </span>
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
                {e.units_processed != null && e.units_processed > 1 && (
                  <>
                    <span>·</span>
                    <span>{e.units_processed} units</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds) {
  const n = Number(seconds);
  if (!isFinite(n)) return '—';
  if (n < 60) return `${Math.round(n)}s`;
  return `${Math.round(n / 60)}m`;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading dashboard...</span>
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-negative)' }}>
          Failed to load dashboard data.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {error?.message || 'Unknown error.'}
        </p>
      </div>
    </div>
  );
}
