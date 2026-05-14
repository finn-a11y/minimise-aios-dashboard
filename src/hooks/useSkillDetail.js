import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTenant } from './useTenant';

/**
 * useSkillDetail
 * --------------
 * Powers `/skills/:slug`. Fetches one skill by slug then everything dependent
 * on its id:
 *   - tasks covered (with per-task baseline + 7d stats)
 *   - 30-day daily execution buckets for the bar chart
 *   - full execution log (most recent 100, paginated client-side)
 *   - linked_assets from the skill row itself (already in skills.linked_assets jsonb)
 *
 * Returns null shape gracefully if the slug doesn't exist (the page renders
 * a "skill not found" empty state).
 */

const CHART_DAYS = 30;

export function useSkillDetail(slug) {
  const tenant = useTenant();
  const tenantId = tenant.tenant_id;

  return useQuery({
    queryKey: ['skill-detail', tenantId, slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      // Step 1 — locate the skill by slug. If it doesn't exist, bail.
      const skillRes = await supabase
        .from('skills')
        .select('id, slug, display_name, description, department_id, status, mode, linked_assets, notes')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .maybeSingle();

      if (skillRes.error) throw skillRes.error;
      const skill = skillRes.data;
      if (!skill) return { skill: null };

      // Step 2 — fan-out for tasks + executions + dept lookup in parallel.
      const [tasksRes, executionsRes, weeklyRes, departmentsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, name, short_name, department_id, category_id, manual_minutes_per_execution, automated_minutes_per_execution, automated_by')
          .eq('tenant_id', tenantId)
          .contains('automated_by', [skill.id]),
        supabase
          .from('skill_executions')
          .select('id, skill_id, operator, started_at, ended_at, duration_seconds, status, units_processed')
          .eq('tenant_id', tenantId)
          .eq('skill_id', skill.id)
          .order('started_at', { ascending: false })
          .limit(100),
        supabase
          .from('task_weekly_stats')
          .select('task_id, executions_last_7d, hours_saved_last_7d')
          .eq('tenant_id', tenantId),
        supabase
          .from('departments')
          .select('id, slug, name')
          .eq('tenant_id', tenantId),
      ]);
      for (const r of [tasksRes, executionsRes, weeklyRes, departmentsRes]) {
        if (r.error) throw r.error;
      }

      const tasks = tasksRes.data || [];
      const executions = executionsRes.data || [];
      const weeklyStats = weeklyRes.data || [];
      const departments = departmentsRes.data || [];

      const weeklyByTask = new Map(weeklyStats.map(w => [w.task_id, w]));
      const deptById = new Map(departments.map(d => [d.id, d]));

      // Need task_categories for the table display.
      const catRes = await supabase
        .from('task_categories')
        .select('id, name')
        .eq('tenant_id', tenantId);
      if (catRes.error) throw catRes.error;
      const categoryById = new Map((catRes.data || []).map(c => [c.id, c]));

      // Enrich tasks with category name + weekly stats + computed delta.
      const tasksEnriched = tasks.map(t => {
        const w = weeklyByTask.get(t.id);
        const execs = Number(w?.executions_last_7d || 0);
        const hours = Number(w?.hours_saved_last_7d || 0);
        return {
          ...t,
          category_name: categoryById.get(t.category_id)?.name || 'Uncategorised',
          executions_last_7d: execs,
          hours_saved_last_7d: hours,
        };
      });

      // Aggregates.
      const completed = executions.filter(e => e.status === 'completed');
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const sevenAgo = new Date(now.getTime() - 7 * dayMs);
      const thirtyAgo = new Date(now.getTime() - CHART_DAYS * dayMs);

      let allTimeHours = 0;
      let last7Hours = 0;
      let last7Count = 0;
      const chartByDay = Array.from({ length: CHART_DAYS }, (_, idx) => {
        const day = new Date(now.getTime() - (CHART_DAYS - 1 - idx) * dayMs);
        return {
          day: day.toISOString().slice(0, 10),
          label: day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          count: 0,
        };
      });

      for (const e of completed) {
        const ts = new Date(e.started_at);
        const units = Math.max(Number(e.units_processed || 1), 1);
        let hours = 0;
        for (const t of tasksEnriched) {
          const m = Number(t.manual_minutes_per_execution || 0);
          const a = Number(t.automated_minutes_per_execution || 0);
          hours += (Math.max(m - a, 0) * units) / 60;
        }
        allTimeHours += hours;
        if (ts >= sevenAgo) {
          last7Hours += hours;
          last7Count += 1;
        }
        if (ts >= thirtyAgo) {
          const dayOffset = Math.floor((now.getTime() - ts.getTime()) / dayMs);
          const bucketIdx = CHART_DAYS - 1 - dayOffset;
          if (bucketIdx >= 0 && bucketIdx < CHART_DAYS) {
            chartByDay[bucketIdx].count += 1;
          }
        }
      }

      const dept = deptById.get(skill.department_id);

      return {
        skill: {
          ...skill,
          department_name: dept?.name || 'Unassigned',
          department_slug: dept?.slug,
        },
        tasks: tasksEnriched,
        executions,
        chart: chartByDay,
        kpis: {
          last_7d_executions: last7Count,
          last_7d_hours_saved: last7Hours,
          all_time_executions: completed.length,
          all_time_hours_saved: allTimeHours,
        },
        linkedAssets: Array.isArray(skill.linked_assets) ? skill.linked_assets : [],
      };
    },
  });
}
