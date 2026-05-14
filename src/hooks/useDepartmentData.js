import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTenant } from './useTenant';

/**
 * useDepartmentData
 * -----------------
 * Powers `/department/:slug`. Loads one department + its scoped skills + tasks
 * + recent execution feed.
 *
 * Returns `{ department: null }` if the slug doesn't exist.
 */

const SPARK_DAYS = 7;

export function useDepartmentData(slug) {
  const tenant = useTenant();
  const tenantId = tenant.tenant_id;

  return useQuery({
    queryKey: ['department-detail', tenantId, slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      // Step 1: find the department by slug.
      const deptRes = await supabase
        .from('departments')
        .select('id, slug, name, display_order')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .maybeSingle();
      if (deptRes.error) throw deptRes.error;
      const department = deptRes.data;
      if (!department) return { department: null };

      // Step 2: fan-out.
      const [skillsRes, tasksRes, categoriesRes, weeklyRes, executionsRes] = await Promise.all([
        supabase
          .from('skills')
          .select('id, slug, display_name, description, status, mode, linked_assets')
          .eq('tenant_id', tenantId)
          .eq('department_id', department.id),
        supabase
          .from('tasks')
          .select('id, name, short_name, category_id, importance, queued, manual_minutes_per_execution, automated_minutes_per_execution, automated_by')
          .eq('tenant_id', tenantId)
          .eq('department_id', department.id),
        supabase
          .from('task_categories')
          .select('id, name, display_order')
          .eq('tenant_id', tenantId)
          .eq('department_id', department.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('task_weekly_stats')
          .select('task_id, executions_last_7d, hours_saved_last_7d')
          .eq('tenant_id', tenantId),
        // Pull all completed executions tenant-wide; filter to this department's skills client-side.
        supabase
          .from('skill_executions')
          .select('id, skill_id, operator, started_at, ended_at, duration_seconds, status, units_processed')
          .eq('tenant_id', tenantId)
          .order('started_at', { ascending: false })
          .limit(200),
      ]);
      for (const r of [skillsRes, tasksRes, categoriesRes, weeklyRes, executionsRes]) {
        if (r.error) throw r.error;
      }

      const skills = skillsRes.data || [];
      const tasksRaw = tasksRes.data || [];
      const categories = categoriesRes.data || [];
      const weekly = weeklyRes.data || [];
      const executions = executionsRes.data || [];

      const skillIds = new Set(skills.map(s => s.id));
      const liveSkillIds = new Set(skills.filter(s => s.status === 'live').map(s => s.id));
      const skillById = new Map(skills.map(s => [s.id, s]));
      const weeklyByTask = new Map(weekly.map(w => [w.task_id, w]));
      const categoryById = new Map(categories.map(c => [c.id, c]));

      // Department-scoped recent runs: any execution where skill_id sits in this dept.
      const scopedExecutions = executions
        .filter(e => skillIds.has(e.skill_id))
        .slice(0, 15);
      const scopedExecutionsWithSkill = scopedExecutions.map(e => ({
        ...e,
        skill_display_name: skillById.get(e.skill_id)?.display_name || 'Unknown skill',
        skill_slug: skillById.get(e.skill_id)?.slug,
      }));

      // Department-scoped hero hours-saved this week = SUM(weekly hours) for tasks in this dept.
      const heroHoursWeek = tasksRaw.reduce((acc, t) => {
        const w = weeklyByTask.get(t.id);
        return acc + Number(w?.hours_saved_last_7d || 0);
      }, 0);
      const heroExecutionsWeek = tasksRaw.reduce((acc, t) => {
        const w = weeklyByTask.get(t.id);
        return acc + Number(w?.executions_last_7d || 0);
      }, 0);

      // Build the per-task row shape that mirrors /tasks.
      const tasksEnriched = tasksRaw.map(t => {
        const linkedSkills = (t.automated_by || []).map(id => skillById.get(id)).filter(Boolean);
        const status = linkedSkills.some(s => liveSkillIds.has(s.id))
          ? 'live'
          : t.queued ? 'queued' : 'manual';
        const w = weeklyByTask.get(t.id);
        return {
          ...t,
          category_name: categoryById.get(t.category_id)?.name || 'Uncategorised',
          category_order: categoryById.get(t.category_id)?.display_order ?? 999,
          status,
          automating_skills: linkedSkills,
          triggers: linkedSkills.map(s => s.mode),
          executions_last_7d: Number(w?.executions_last_7d || 0),
          hours_saved_last_7d: Number(w?.hours_saved_last_7d || 0),
          manual_minutes: Number(t.manual_minutes_per_execution || 0),
          automated_minutes: Number(t.automated_minutes_per_execution || 0),
        };
      });

      // Skill cards (same shape as /skills, but only for this dept).
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const sevenAgo = new Date(now.getTime() - 7 * dayMs);

      const tasksBySkill = new Map();
      for (const t of tasksRaw) {
        for (const id of (t.automated_by || [])) {
          if (!tasksBySkill.has(id)) tasksBySkill.set(id, []);
          tasksBySkill.get(id).push(t);
        }
      }

      const skillsEnriched = skills.map(s => {
        const skillExecs = executions.filter(e => e.skill_id === s.id && e.status === 'completed');
        const linkedTasks = tasksBySkill.get(s.id) || [];
        let last7Hours = 0;
        let last7Count = 0;
        let allTimeHours = 0;
        const spark = Array.from({ length: SPARK_DAYS }, () => 0);
        for (const e of skillExecs) {
          const ts = new Date(e.started_at);
          const units = Math.max(Number(e.units_processed || 1), 1);
          let hours = 0;
          for (const t of linkedTasks) {
            const m = Number(t.manual_minutes_per_execution || 0);
            const a = Number(t.automated_minutes_per_execution || 0);
            hours += (Math.max(m - a, 0) * units) / 60;
          }
          allTimeHours += hours;
          if (ts >= sevenAgo) {
            last7Hours += hours;
            last7Count += 1;
            const dayOffset = Math.floor((now.getTime() - ts.getTime()) / dayMs);
            if (dayOffset >= 0 && dayOffset < SPARK_DAYS) {
              spark[SPARK_DAYS - 1 - dayOffset] += 1;
            }
          }
        }
        return {
          ...s,
          tasks_covered: linkedTasks,
          tasks_covered_count: linkedTasks.length,
          last_7d_executions: last7Count,
          last_7d_hours_saved: last7Hours,
          all_time_executions: skillExecs.length,
          all_time_hours_saved: allTimeHours,
          sparkline: spark,
          ever_ran: skillExecs.length > 0,
          department_name: department.name,
          department_slug: department.slug,
        };
      });

      return {
        department,
        skills: skillsEnriched,
        tasks: tasksEnriched,
        categories,
        recentExecutions: scopedExecutionsWithSkill,
        heroHoursWeek,
        heroExecutionsWeek,
      };
    },
  });
}
