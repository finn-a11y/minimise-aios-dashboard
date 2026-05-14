import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTenant } from './useTenant';

/**
 * useSkillsData
 * -------------
 * Powers `/skills`. For each skill returns:
 *   - the skill row
 *   - tasks it covers (via tasks.automated_by @> [skill.id])
 *   - last-7d execution count + hours saved
 *   - all-time execution count + hours saved
 *   - 7-day daily-execution sparkline
 *   - operator avatars (unique operators in last 30d)
 *
 * Plus a flat paginated activity log under the grid.
 */

const SPARK_DAYS = 7;

export function useSkillsData() {
  const tenant = useTenant();
  const tenantId = tenant.tenant_id;

  return useQuery({
    queryKey: ['skills-page', tenantId],
    queryFn: async () => {
      const [skillsRes, tasksRes, departmentsRes, executionsRes, activityRes] = await Promise.all([
        supabase
          .from('skills')
          .select('id, slug, display_name, description, department_id, status, mode, linked_assets')
          .eq('tenant_id', tenantId)
          .order('display_name', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, name, short_name, department_id, automated_by, manual_minutes_per_execution, automated_minutes_per_execution')
          .eq('tenant_id', tenantId),
        supabase
          .from('departments')
          .select('id, slug, name, display_order')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true }),
        // All completed executions (used for aggregates + sparkline).
        supabase
          .from('skill_executions')
          .select('skill_id, started_at, units_processed, operator, status')
          .eq('tenant_id', tenantId)
          .eq('status', 'completed'),
        // Activity log — most recent 50 executions of any status.
        supabase
          .from('skill_executions')
          .select('id, skill_id, operator, started_at, ended_at, duration_seconds, status, units_processed')
          .eq('tenant_id', tenantId)
          .order('started_at', { ascending: false })
          .limit(50),
      ]);

      for (const r of [skillsRes, tasksRes, departmentsRes, executionsRes, activityRes]) {
        if (r.error) throw r.error;
      }

      const skills = skillsRes.data || [];
      const tasks = tasksRes.data || [];
      const departments = departmentsRes.data || [];
      const allExecutions = executionsRes.data || [];
      const activity = activityRes.data || [];

      const deptById = new Map(departments.map(d => [d.id, d]));
      const tasksBySkill = new Map();
      for (const t of tasks) {
        for (const id of (t.automated_by || [])) {
          if (!tasksBySkill.has(id)) tasksBySkill.set(id, []);
          tasksBySkill.get(id).push(t);
        }
      }

      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs);

      const enrichedSkills = skills.map(skill => {
        const linkedTasks = tasksBySkill.get(skill.id) || [];
        const skillExecutions = allExecutions.filter(e => e.skill_id === skill.id);

        let allTimeHours = 0;
        let last7Hours = 0;
        let last7Count = 0;
        const operators = new Set();
        const spark = Array.from({ length: SPARK_DAYS }, () => 0);

        for (const e of skillExecutions) {
          const ts = new Date(e.started_at);
          const units = Math.max(Number(e.units_processed || 1), 1);
          let hours = 0;
          for (const t of linkedTasks) {
            const m = Number(t.manual_minutes_per_execution || 0);
            const a = Number(t.automated_minutes_per_execution || 0);
            hours += (Math.max(m - a, 0) * units) / 60;
          }
          allTimeHours += hours;

          if (ts >= sevenDaysAgo) {
            last7Hours += hours;
            last7Count += 1;
            const dayOffset = Math.floor((now.getTime() - ts.getTime()) / dayMs);
            if (dayOffset >= 0 && dayOffset < SPARK_DAYS) {
              spark[SPARK_DAYS - 1 - dayOffset] += 1;
            }
          }

          if (ts >= thirtyDaysAgo && e.operator) operators.add(e.operator);
        }

        const dept = deptById.get(skill.department_id);
        return {
          ...skill,
          department_name: dept?.name || 'Unassigned',
          department_slug: dept?.slug,
          department_order: dept?.display_order ?? 999,
          tasks_covered: linkedTasks,
          tasks_covered_count: linkedTasks.length,
          all_time_executions: skillExecutions.length,
          all_time_hours_saved: allTimeHours,
          last_7d_executions: last7Count,
          last_7d_hours_saved: last7Hours,
          sparkline: spark,
          operators: Array.from(operators),
          ever_ran: skillExecutions.length > 0,
        };
      });

      const skillById = new Map(skills.map(s => [s.id, s]));
      const activityWithSkill = activity.map(a => ({
        ...a,
        skill_display_name: skillById.get(a.skill_id)?.display_name || 'Unknown skill',
        skill_slug: skillById.get(a.skill_id)?.slug,
      }));

      return {
        skills: enrichedSkills,
        departments,
        activity: activityWithSkill,
      };
    },
  });
}
