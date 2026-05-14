import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTenant } from './useTenant';

/**
 * useTasksData
 * ------------
 * Fetches everything `/tasks` needs:
 *
 *   - tasks (with category + dept ids and automated_by skill ids)
 *   - task_weekly_stats (per-task executions + hours saved over 7d)
 *   - task_categories (for grouping + ordering)
 *   - departments (for top-level group ordering)
 *   - skills (so we can chip + show trigger pill per task)
 *
 * The page itself groups tasks by department × category. We pre-compute the
 * derived shape (status pill, automating skill chips, triggers) and return
 * everything denormalized so the component is pure render.
 */

function deriveStatus(task, liveSkillIds) {
  const skillIds = Array.isArray(task.automated_by) ? task.automated_by : [];
  if (skillIds.some(id => liveSkillIds.has(id))) return 'live';
  if (task.queued) return 'queued';
  return 'manual';
}

export function useTasksData() {
  const tenant = useTenant();
  const tenantId = tenant.tenant_id;

  return useQuery({
    queryKey: ['tasks-page', tenantId],
    queryFn: async () => {
      const [tasksRes, weeklyRes, categoriesRes, departmentsRes, skillsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, name, short_name, department_id, category_id, importance, queued, manual_minutes_per_execution, automated_minutes_per_execution, automated_by')
          .eq('tenant_id', tenantId),
        supabase
          .from('task_weekly_stats')
          .select('task_id, executions_last_7d, hours_saved_last_7d')
          .eq('tenant_id', tenantId),
        supabase
          .from('task_categories')
          .select('id, name, department_id, display_order')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true }),
        supabase
          .from('departments')
          .select('id, slug, name, display_order')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true }),
        supabase
          .from('skills')
          .select('id, slug, display_name, status, mode')
          .eq('tenant_id', tenantId),
      ]);

      for (const r of [tasksRes, weeklyRes, categoriesRes, departmentsRes, skillsRes]) {
        if (r.error) throw r.error;
      }

      const tasks = tasksRes.data || [];
      const weekly = weeklyRes.data || [];
      const categories = categoriesRes.data || [];
      const departments = departmentsRes.data || [];
      const skills = skillsRes.data || [];

      const weeklyByTask = new Map(weekly.map(w => [w.task_id, w]));
      const categoryById = new Map(categories.map(c => [c.id, c]));
      const deptById = new Map(departments.map(d => [d.id, d]));
      const skillById = new Map(skills.map(s => [s.id, s]));
      const liveSkillIds = new Set(skills.filter(s => s.status === 'live').map(s => s.id));

      // Denormalize each task with everything the row needs.
      const enriched = tasks.map(t => {
        const status = deriveStatus(t, liveSkillIds);
        const stats = weeklyByTask.get(t.id);
        const dept = deptById.get(t.department_id);
        const category = categoryById.get(t.category_id);
        const automatingSkills = (t.automated_by || [])
          .map(id => skillById.get(id))
          .filter(Boolean);
        // weighted average of triggers across skills (first wins for the pill)
        const triggers = automatingSkills.map(s => s.mode);
        const manual = Number(t.manual_minutes_per_execution || 0);
        const auto = Number(t.automated_minutes_per_execution || 0);
        const execs7 = Number(stats?.executions_last_7d || 0);
        const hours7 = Number(stats?.hours_saved_last_7d || 0);
        return {
          id: t.id,
          name: t.name,
          short_name: t.short_name,
          status,
          importance: t.importance,
          department_id: t.department_id,
          department_slug: dept?.slug,
          department_name: dept?.name,
          department_order: dept?.display_order ?? 999,
          category_id: t.category_id,
          category_name: category?.name || 'Uncategorised',
          category_order: category?.display_order ?? 999,
          manual_minutes: manual,
          automated_minutes: auto,
          executions_last_7d: execs7,
          hours_saved_last_7d: hours7,
          // runs/wk shown on the row — if not yet running, render "—"
          runs_per_week: execs7,
          automating_skills: automatingSkills,
          triggers,
        };
      });

      return {
        tasks: enriched,
        departments,
        categories,
        skills,
      };
    },
  });
}
