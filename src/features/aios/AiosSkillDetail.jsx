import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import KPICard from '../../components/KPICard';
import { useSkillDetail } from '../../hooks/useSkillDetail';
import { StatusPill, TriggerPill, EmptyIconRow } from './pills';
import { fmtMinutes, fmtHours, fmtRelativeTime } from './format';
import { ArrowLeft, Pulse, Stack, Link as LinkIcon } from '../../components/icons';

const PAGE_SIZE = 25;

export default function AiosSkillDetail() {
  const { slug } = useParams();
  const { data, isLoading, error } = useSkillDetail(slug);
  const [logPage, setLogPage] = useState(0);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError error={error} />;
  if (!data) return null;
  if (!data.skill) return <NotFound slug={slug} />;

  const { skill, tasks, executions, chart, kpis, linkedAssets } = data;

  const pageStart = logPage * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pageRows = executions.slice(pageStart, pageEnd);
  const totalPages = Math.max(Math.ceil(executions.length / PAGE_SIZE), 1);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Link
        to="/skills"
        className="inline-flex items-center gap-1 text-[12px] mb-1"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft size={12} />
        All skills
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {skill.display_name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {skill.description || 'No description set.'}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusPill status={skill.status} />
            <TriggerPill mode={skill.mode} />
            {skill.department_slug && (
              <Link
                to={`/department/${skill.department_slug}`}
                className="text-[11px] underline-offset-2 hover:underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {skill.department_name}
              </Link>
            )}
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
              {skill.slug}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Last 7d runs" value={`${kpis.last_7d_executions}`} baseline="" baselineLabel="" />
        <KPICard title="Last 7d hours saved" value={fmtHours(kpis.last_7d_hours_saved)} baseline="" baselineLabel="" />
        <KPICard title="All-time runs" value={`${kpis.all_time_executions}`} baseline="" baselineLabel="" />
        <KPICard title="All-time hours saved" value={fmtHours(kpis.all_time_hours_saved)} baseline="" baselineLabel="" />
      </div>

      <section>
        <SectionHeader title="Last 30 days" hint="Daily execution count." />
        <div className="card p-4 sm:p-6">
          <ExecutionChart chart={chart} />
        </div>
      </section>

      <section>
        <SectionHeader title="Tasks this skill covers" hint={`${tasks.length} task${tasks.length === 1 ? '' : 's'}`} />
        {tasks.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={Stack} label="Not yet wired to any tracked task." hint="When this skill takes over a tracked task, it'll show up here." />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden md:grid items-center gap-3 px-4 py-2 text-[11px] font-medium tracking-wide"
              style={{
                color: 'var(--text-tertiary)',
                gridTemplateColumns: 'minmax(0, 2fr) 1fr 64px 64px 64px 80px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>Task</span>
              <span>Category</span>
              <span className="text-right">Manual</span>
              <span className="text-right">Auto</span>
              <span className="text-right">Runs/wk</span>
              <span className="text-right">Hrs/wk</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {tasks.map(t => (
                <div key={t.id} className="grid items-center gap-3 px-4 py-3 row-hover"
                  style={{ gridTemplateColumns: 'minmax(0, 2fr) 1fr 64px 64px 64px 80px' }}
                >
                  <Link to="/tasks" className="text-sm font-medium truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </Link>
                  <span className="text-[12px] truncate" style={{ color: 'var(--text-tertiary)' }}>{t.category_name}</span>
                  <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                    {fmtMinutes(t.manual_minutes_per_execution)}
                  </span>
                  <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                    {fmtMinutes(t.automated_minutes_per_execution)}
                  </span>
                  <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                    {t.executions_last_7d > 0 ? t.executions_last_7d : '—'}
                  </span>
                  <span className="text-[12px] tabular-nums text-right font-semibold"
                    style={{ color: t.hours_saved_last_7d > 0 ? 'var(--color-positive)' : 'var(--text-tertiary)' }}
                  >
                    {t.hours_saved_last_7d > 0 ? fmtHours(t.hours_saved_last_7d) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Execution log" hint={`${executions.length} total`} />
        {executions.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={Pulse} label="Never run." hint="Once this skill executes, runs will appear here." />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden md:grid items-center gap-3 px-4 py-2 text-[11px] font-medium tracking-wide"
              style={{
                color: 'var(--text-tertiary)',
                gridTemplateColumns: '1fr 1fr 1fr 80px 80px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>Operator</span>
              <span>When</span>
              <span>Duration</span>
              <span className="text-right">Status</span>
              <span className="text-right">Units</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {pageRows.map(e => (
                <div key={e.id} className="grid items-center gap-3 px-4 py-2 row-hover"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 80px 80px' }}
                >
                  <span className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{e.operator || 'unknown'}</span>
                  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{fmtRelativeTime(e.started_at)}</span>
                  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{formatDuration(e.duration_seconds)}</span>
                  <span className="text-right">
                    <StatusPill status={e.status === 'completed' ? 'live' : e.status === 'failed' ? 'killed' : 'building'} />
                  </span>
                  <span className="text-[12px] tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                    {e.units_processed ?? '—'}
                  </span>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  Page {logPage + 1} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="pill-tab disabled:opacity-40"
                    disabled={logPage === 0}
                    onClick={() => setLogPage(p => Math.max(p - 1, 0))}
                  >Prev</button>
                  <button
                    className="pill-tab disabled:opacity-40"
                    disabled={logPage >= totalPages - 1}
                    onClick={() => setLogPage(p => Math.min(p + 1, totalPages - 1))}
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Linked assets" hint={linkedAssets.length ? `${linkedAssets.length} linked` : 'None linked'} />
        {linkedAssets.length === 0 ? (
          <div className="card p-6">
            <EmptyIconRow icon={LinkIcon} label="No assets linked yet." hint="Add `linked_assets` in the skill record to surface scripts, docs, or sheets here." />
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {linkedAssets.map((asset, idx) => <LinkedAssetRow key={idx} asset={asset} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function LinkedAssetRow({ asset }) {
  // Linked-asset shape is jsonb so be defensive — accept strings or objects.
  if (typeof asset === 'string') {
    return (
      <div className="px-4 py-3 row-hover flex items-center gap-2">
        <LinkIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{asset}</span>
      </div>
    );
  }
  const label = asset.label || asset.name || asset.path || 'Linked asset';
  const path = asset.path || asset.url || asset.href;
  return (
    <div className="px-4 py-3 row-hover flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <LinkIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{label}</span>
      </div>
      {path && (
        <span className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{path}</span>
      )}
    </div>
  );
}

function ExecutionChart({ chart }) {
  if (!chart.length || chart.every(c => c.count === 0)) {
    return <EmptyIconRow icon={Pulse} label="No runs in the last 30 days." />;
  }
  return (
    <div style={{ height: 220, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={chart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0 !important" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8a9c94', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8a9c94', fontSize: 10 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(4, 120, 87, 0.06)' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: 'rgba(16,185,129,0.1)',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'Runs']}
          />
          <Bar dataKey="count" fill="#047857" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDuration(seconds) {
  const n = Number(seconds);
  if (!isFinite(n)) return '—';
  if (n < 60) return `${Math.round(n)}s`;
  return `${(n / 60).toFixed(1)}m`;
}

function SectionHeader({ title, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {hint && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{hint}</span>}
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading skill...</span>
      </div>
    </div>
  );
}

function NotFound({ slug }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Skill not found.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          No skill with slug <span className="font-mono">{slug}</span> for this tenant.
        </p>
        <Link to="/skills" className="text-xs underline mt-2 inline-block" style={{ color: 'var(--brand-primary)' }}>
          Back to all skills
        </Link>
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-6">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-negative)' }}>Failed to load skill.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error?.message}</p>
      </div>
    </div>
  );
}
