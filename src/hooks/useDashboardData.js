import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTenant } from './useTenant';

/**
 * useDashboardData
 * ----------------
 * Fetches everything `/` (AiosOverview) needs in a handful of parallel calls:
 *
 *   - tenant row
 *   - departments (6, dept grid)
 *   - skills (status / mode / dept_id — used for "skills live" KPI)
 *   - tasks (light shape — used for "tasks automated" KPI)
 *   - task_weekly_stats (per-task 7-day hours saved — feeds dept hours and HERO weekly)
 *   - coming_next (3 rows for the strip — spec says 3, we fetch 5 + slice)
 *   - skill_executions (most recent 10 for the activity feed; all-time aggregate by task)
 *   - 7-day daily execution counts for the hero sparkline
 *
 * Every read is filtered by `tenant_id` from `useTenant()`.
 * QueryClientProvider sets `refetchInterval: 30_000` for us.
 */

const HERO_SPARK_DAYS = 7;

export function useDashboardData() {
  const tenant = useTenant();
  const tenantId = tenant.tenant_id;

  return useQuery({
    queryKey: ['dashboard-overview', tenantId],
    queryFn: async () => {
      // Fire in parallel — none of these depends on the others.
      const [
        departmentsRes,
        skillsRes,
        tasksRes,
        weeklyStatsRes,
        comingNextRes,
        recentExecutionsRes,
        allExecutionsRes,
      ] = await Promise.all([
        supabase
          .from('departments')
          .select('id, slug, name, display_order, dashboard_dept')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true }),
        supabase
          .from('skills')
          .select('id, slug, display_name, department_id, status, mode')
          .eq('tenant_id', tenantId),
        supabase
          .from('tasks')
          .select('id, name, department_id, automated_by, manual_minutes_per_execution, automated_minutes_per_execution')
          .eq('tenant_id', tenantId),
        supabase
          .from('task_weekly_stats')
          .select('task_id, executions_last_7d, hours_saved_last_7d')
          .eq('tenant_id', tenantId),
        supabase
          .from('coming_next')
          .select('id, task_name, department_id, leverage, display_order')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true })
          .limit(5),
        supabase
          .from('skill_executions')
          .select('id, skill_id, operator, started_at, ended_at, duration_seconds, status, units_processed')
          .eq('tenant_id', tenantId)
          .order('started_at', { ascending: false })
          .limit(10),
        // All completed executions — used for the cumulative "since day 1" line.
        // Public dataset, small volumes (hundreds, not millions). Fine to pull.
        supabase
          .from('skill_executions')
          .select('skill_id, started_at, units_processed, status')
          .eq('tenant_id', tenantId)
          .eq('status', 'completed'),
      ]);

      // Surface any failure — caller renders the empty/error state.
      for (const res of [departmentsRes, skillsRes, tasksRes, weeklyStatsRes, comingNextRes, recentExecutionsRes, allExecutionsRes]) {
        if (res.error) throw res.error;
      }

      const departments = departmentsRes.data || [];
      const skills = skillsRes.data || [];
      const tasks = tasksRes.data || [];
      const weeklyStats = weeklyStatsRes.data || [];
      const comingNext = comingNextRes.data || [];
      const recentExecutions = recentExecutionsRes.data || [];
      const allExecutions = allExecutionsRes.data || [];

      const skillById = new Map(skills.map(s => [s.id, s]));
      const weeklyByTask = new Map(weeklyStats.map(w => [w.task_id, w]));

      // KPI: skills live
      const skillsLive = skills.filter(s => s.status === 'live').length;
      const skillsTotal = skills.length;

      // KPI: tasks automated vs manual
      // Definition: a task is "automated" if its automated_by array contains at least
      // one skill_id that resolves to a `live` skill.
      const liveSkillIds = new Set(skills.filter(s => s.status === 'live').map(s => s.id));
      const tasksAutomated = tasks.filter(t =>
        Array.isArray(t.automated_by) && t.automated_by.some(id => liveSkillIds.has(id))
      ).length;
      const tasksTotal = tasks.length;
      const tasksManual = Math.max(tasksTotal - tasksAutomated, 0);

      // HERO: hours saved this week — SUM(hours_saved_last_7d) across all tasks.
      const hoursSavedWeek = weeklyStats.reduce(
        (acc, w) => acc + Number(w.hours_saved_last_7d || 0),
        0
      );

      // HERO sub-line: cumulative hours saved since day 1.
      // (manual - automated) * units_processed / 60, summed across all completed
      // executions, joined via the linked task's per-execution minutes. A skill
      // can power multiple tasks — we credit each task once per execution.
      const tasksBySkill = new Map();
      for (const t of tasks) {
        for (const skillId of (t.automated_by || [])) {
          if (!tasksBySkill.has(skillId)) tasksBySkill.set(skillId, []);
          tasksBySkill.get(skillId).push(t);
        }
      }
      let hoursSavedAllTime = 0;
      for (const e of allExecutions) {
        const linkedTasks = tasksBySkill.get(e.skill_id) || [];
        if (!linkedTasks.length) continue;
        // Heuristic: if this execution links to N tasks, credit each task's delta
        // weighted by units_processed (default 1 if null/0).
        const units = Math.max(Number(e.units_processed || 1), 1);
        for (const t of linkedTasks) {
          const manual = Number(t.manual_minutes_per_execution || 0);
          const auto = Number(t.automated_minutes_per_execution || 0);
          const deltaMin = Math.max(manual - auto, 0);
          hoursSavedAllTime += (deltaMin * units) / 60;
        }
      }

      // HERO delta vs last week.
      // last-7d total comes from the view; previous-7d needs a count of executions
      // in that window per skill, weighted by task delta. Compute from allExecutions.
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const last7Start = new Date(now.getTime() - sevenDaysMs);
      const prev7Start = new Date(now.getTime() - 2 * sevenDaysMs);
      let hoursSavedPrev7 = 0;
      for (const e of allExecutions) {
        const ts = new Date(e.started_at);
        if (ts < prev7Start || ts >= last7Start) continue;
        const linkedTasks = tasksBySkill.get(e.skill_id) || [];
        const units = Math.max(Number(e.units_processed || 1), 1);
        for (const t of linkedTasks) {
          const manual = Number(t.manual_minutes_per_execution || 0);
          const auto = Number(t.automated_minutes_per_execution || 0);
          const deltaMin = Math.max(manual - auto, 0);
          hoursSavedPrev7 += (deltaMin * units) / 60;
        }
      }
      const heroDeltaPct = hoursSavedPrev7 > 0
        ? Math.round(((hoursSavedWeek - hoursSavedPrev7) / hoursSavedPrev7) * 100)
        : null;

      // HERO sparkline: hours saved per day for the last 7 days.
      const sparklineByDay = Array.from({ length: HERO_SPARK_DAYS }, () => 0);
      for (const e of allExecutions) {
        const ts = new Date(e.started_at);
        if (ts < last7Start) continue;
        const dayOffset = Math.floor((now.getTime() - ts.getTime()) / (24 * 60 * 60 * 1000));
        if (dayOffset < 0 || dayOffset >= HERO_SPARK_DAYS) continue;
        const linkedTasks = tasksBySkill.get(e.skill_id) || [];
        const units = Math.max(Number(e.units_processed || 1), 1);
        let hours = 0;
        for (const t of linkedTasks) {
          const manual = Number(t.manual_minutes_per_execution || 0);
          const auto = Number(t.automated_minutes_per_execution || 0);
          hours += (Math.max(manual - auto, 0) * units) / 60;
        }
        // older day at index 0, today at the end — push from the right.
        const bucket = HERO_SPARK_DAYS - 1 - dayOffset;
        sparklineByDay[bucket] += hours;
      }

      // Per-department aggregate.
      // hoursThisWeek = sum of weekly hours_saved_last_7d for tasks in the dept.
      // automated/total = task counts.
      const deptAggregates = departments.map(dept => {
        const deptTasks = tasks.filter(t => t.department_id === dept.id);
        const deptHours = deptTasks.reduce((acc, t) => {
          const w = weeklyByTask.get(t.id);
          return acc + Number(w?.hours_saved_last_7d || 0);
        }, 0);
        const automatedCount = deptTasks.filter(t =>
          Array.isArray(t.automated_by) && t.automated_by.some(id => liveSkillIds.has(id))
        ).length;
        return {
          ...dept,
          hours_saved_week: deptHours,
          tasks_automated: automatedCount,
          tasks_total: deptTasks.length,
        };
      });

      // Recent runs — denormalize the skill name + dept for display.
      const recentWithSkill = recentExecutions.map(e => {
        const skill = skillById.get(e.skill_id);
        return {
          ...e,
          skill_display_name: skill?.display_name || 'Unknown skill',
          skill_slug: skill?.slug,
          skill_status: skill?.status,
        };
      });

      // Coming-next: denormalize dept name.
      const deptById = new Map(departments.map(d => [d.id, d]));
      const comingNextWithDept = comingNext.slice(0, 3).map(c => ({
        ...c,
        department_name: c.department_id ? deptById.get(c.department_id)?.name : null,
      }));

      return {
        skillsLive,
        skillsTotal,
        tasksAutomated,
        tasksManual,
        tasksTotal,
        hoursSavedWeek,
        hoursSavedAllTime,
        heroDeltaPct,
        heroSparkline: sparklineByDay,
        departments: deptAggregates,
        comingNext: comingNextWithDept,
        recentExecutions: recentWithSkill,
        hasAnyExecutions: allExecutions.length > 0,
      };
    },
  });
}
