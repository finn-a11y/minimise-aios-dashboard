-- Service-role grants — patch to the 2026-05-14 base migration.
--
-- The base migration granted SELECT to anon + authenticated but missed
-- service_role. With "automatically expose new tables" OFF in Supabase
-- project settings, service_role does NOT get implicit grants and needs
-- them spelled out, even though RLS is bypassed for that role.
--
-- This patch is idempotent. The base migration has been amended too, so
-- fresh forks won't need to apply it separately.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants            TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_categories    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills             TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks              TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coming_next        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_executions   TO service_role;
GRANT SELECT                          ON public.task_weekly_stats TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
