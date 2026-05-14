import React from 'react';
import { Link } from 'react-router-dom';
import { Lightning, Clock, Pulse, X as XIcon, Stack } from '../../components/icons';

/**
 * Tiny pill primitives shared by /, /tasks, /skills, /skills/:slug, /department/:slug.
 * Built on top of the .badge-* component classes defined in index.css.
 *
 * Pure formatters (fmtMinutes / fmtHours / fmtRelativeTime) live in format.js
 * alongside this file. They were previously re-exported here but Fast Refresh
 * doesn't like mixing components + plain helpers in one module.
 */

const STATUS_LABELS = {
  live: 'Live',
  building: 'Building',
  queued: 'Queued',
  killed: 'Killed',
  manual: 'Manual',
};

const STATUS_CLASS = {
  live: 'badge badge-positive',
  building: 'badge badge-info',
  queued: 'badge badge-warning',
  killed: 'badge badge-negative',
  manual: 'badge badge-neutral',
};

export function StatusPill({ status }) {
  const label = STATUS_LABELS[status] || status;
  const className = STATUS_CLASS[status] || 'badge badge-neutral';
  return <span className={className}>{label}</span>;
}

const MODE_LABELS = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  event: 'Event',
};

const MODE_ICONS = {
  manual: Lightning,
  scheduled: Clock,
  event: Pulse,
};

const MODE_CLASS = {
  manual: 'badge badge-neutral',
  scheduled: 'badge badge-info',
  event: 'badge badge-positive',
};

export function TriggerPill({ mode }) {
  if (!mode) return null;
  const label = MODE_LABELS[mode] || mode;
  const ModeIcon = MODE_ICONS[mode] || Lightning;
  const className = MODE_CLASS[mode] || 'badge badge-neutral';
  return (
    <span className={`${className} inline-flex items-center gap-1`}>
      <ModeIcon size={10} />
      {label}
    </span>
  );
}

/**
 * Skill chip — a small clickable link to the skill detail page.
 * Used inside /tasks rows and on the dept page tasks table.
 */
export function SkillChip({ skill }) {
  if (!skill) return null;
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-subtle)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-default)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Stack size={10} />
      {skill.display_name}
    </Link>
  );
}

/**
 * Cross-page empty-state row with optional icon. Caller passes an icon
 * component via the `icon` prop.
 */
export function EmptyIconRow({ icon, label, hint }) {
  const Icon = icon || XIcon;
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <p className="empty-state-text">{label}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
