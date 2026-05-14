-- AIOS Dashboard v3 — initial schema
-- Created 2026-05-14 as part of Stream 1 of the aios-dashboard-v3 build.
--
-- Tenant-shaped from day 1: every table carries tenant_id, every fork (Minimise +
-- per-client) gets its own Supabase project, and RLS scopes anon reads to the
-- tenant carried in the request. Service role bypasses RLS.
--
-- Public read-only model: anon can SELECT rows where they match the tenant_id
-- being queried. The frontend constrains by tenant via the standard PostgREST
-- filter (`?tenant_id=eq.<uuid>`), and the dashboard URL itself is per-tenant.
-- No personal data is in these tables — tasks list verbs, not entity names.

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- tenants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    name        text NOT NULL,
    tagline     text,
    logo_path   text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- departments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    slug            text NOT NULL,
    name            text NOT NULL,
    display_order   integer NOT NULL DEFAULT 0,
    dashboard_dept  text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_tenant_slug_idx
    ON public.departments (tenant_id, slug);

-- ----------------------------------------------------------------------------
-- task_categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    department_id   uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name            text NOT NULL,
    display_order   integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS task_categories_tenant_dept_name_idx
    ON public.task_categories (tenant_id, department_id, name);

-- ----------------------------------------------------------------------------
-- skills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    slug            text NOT NULL,
    display_name    text NOT NULL,
    description     text,
    department_id   uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    status          text NOT NULL DEFAULT 'live',
    mode            text NOT NULL DEFAULT 'manual',
    linked_assets   jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skills_tenant_slug_idx
    ON public.skills (tenant_id, slug);

-- status: live | building | queued | killed
-- mode:   manual | scheduled | event
ALTER TABLE public.skills
    DROP CONSTRAINT IF EXISTS skills_status_check;
ALTER TABLE public.skills
    ADD CONSTRAINT skills_status_check
    CHECK (status IN ('live', 'building', 'queued', 'killed'));

ALTER TABLE public.skills
    DROP CONSTRAINT IF EXISTS skills_mode_check;
ALTER TABLE public.skills
    ADD CONSTRAINT skills_mode_check
    CHECK (mode IN ('manual', 'scheduled', 'event'));

-- ----------------------------------------------------------------------------
-- tasks
-- NOTE: NO executions_per_week column. Live counts are computed from
-- skill_executions via the task_weekly_stats view.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id                               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name                             text NOT NULL,
    short_name                       text,
    department_id                    uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    category_id                      uuid REFERENCES public.task_categories(id) ON DELETE SET NULL,
    importance                       text NOT NULL DEFAULT 'medium',
    queued                           boolean NOT NULL DEFAULT false,
    manual_minutes_per_execution     numeric,
    automated_minutes_per_execution  numeric,
    automated_by                     uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
    created_at                       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tasks_tenant_name_idx
    ON public.tasks (tenant_id, name);

CREATE INDEX IF NOT EXISTS tasks_tenant_dept_idx
    ON public.tasks (tenant_id, department_id);

-- ----------------------------------------------------------------------------
-- coming_next
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coming_next (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    task_name       text NOT NULL,
    department_id   uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    leverage        text NOT NULL DEFAULT 'S',
    display_order   integer NOT NULL DEFAULT 0,
    source_doc      text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coming_next_tenant_taskname_idx
    ON public.coming_next (tenant_id, task_name);

ALTER TABLE public.coming_next
    DROP CONSTRAINT IF EXISTS coming_next_leverage_check;
ALTER TABLE public.coming_next
    ADD CONSTRAINT coming_next_leverage_check
    CHECK (leverage IN ('S', 'M', 'L'));

-- ----------------------------------------------------------------------------
-- skill_executions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_executions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    skill_id          uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    session_id        text,
    operator          text,
    started_at        timestamptz NOT NULL DEFAULT now(),
    ended_at          timestamptz,
    duration_seconds  numeric,
    status            text NOT NULL DEFAULT 'in_progress',
    units_processed   integer,
    metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_executions_skill_started_idx
    ON public.skill_executions (skill_id, started_at DESC);

CREATE INDEX IF NOT EXISTS skill_executions_tenant_started_idx
    ON public.skill_executions (tenant_id, started_at DESC);

ALTER TABLE public.skill_executions
    DROP CONSTRAINT IF EXISTS skill_executions_status_check;
ALTER TABLE public.skill_executions
    ADD CONSTRAINT skill_executions_status_check
    CHECK (status IN ('in_progress', 'completed', 'failed', 'timed_out'));

-- ----------------------------------------------------------------------------
-- view: task_weekly_stats
-- For each task, compute number of executions of its linked skills in the last
-- 7 days and the hours saved over that window.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.task_weekly_stats AS
SELECT
    t.id          AS task_id,
    t.tenant_id   AS tenant_id,
    COALESCE(SUM(exec_count.cnt), 0)::bigint AS executions_last_7d,
    COALESCE(
        SUM(
            exec_count.cnt
            * GREATEST(COALESCE(t.manual_minutes_per_execution, 0)
                       - COALESCE(t.automated_minutes_per_execution, 0), 0)
        ) / 60.0,
        0
    )::numeric AS hours_saved_last_7d
FROM public.tasks t
LEFT JOIN LATERAL (
    SELECT s.skill_id, COUNT(*)::bigint AS cnt
    FROM public.skill_executions s
    WHERE s.skill_id = ANY (t.automated_by)
      AND s.tenant_id = t.tenant_id
      AND s.started_at >= (now() - interval '7 days')
      AND s.status = 'completed'
    GROUP BY s.skill_id
) AS exec_count ON true
GROUP BY t.id, t.tenant_id, t.manual_minutes_per_execution, t.automated_minutes_per_execution;

-- ----------------------------------------------------------------------------
-- RLS — public read-only model, scoped by tenant_id filter in the request.
--
-- anon role: SELECT only. WHERE clause on tenant_id (or via PostgREST filter)
-- gives the tenant scoping; the URL is per-tenant so nothing leaks across
-- tenants when used correctly. Service role bypasses RLS entirely for writes.
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coming_next        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_executions   ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner so policies are the single source of truth.
ALTER TABLE public.tenants            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skills             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.coming_next        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skill_executions   FORCE ROW LEVEL SECURITY;

-- Public SELECT (frontend filters by tenant_id in the query itself).
DROP POLICY IF EXISTS tenants_anon_select ON public.tenants;
CREATE POLICY tenants_anon_select ON public.tenants
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS departments_anon_select ON public.departments;
CREATE POLICY departments_anon_select ON public.departments
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS task_categories_anon_select ON public.task_categories;
CREATE POLICY task_categories_anon_select ON public.task_categories
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS skills_anon_select ON public.skills;
CREATE POLICY skills_anon_select ON public.skills
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS tasks_anon_select ON public.tasks;
CREATE POLICY tasks_anon_select ON public.tasks
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS coming_next_anon_select ON public.coming_next;
CREATE POLICY coming_next_anon_select ON public.coming_next
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS skill_executions_anon_select ON public.skill_executions;
CREATE POLICY skill_executions_anon_select ON public.skill_executions
    FOR SELECT TO anon USING (true);

-- ----------------------------------------------------------------------------
-- Grants
-- The Supabase project has "automatically expose new tables" OFF, so anon
-- needs explicit SELECT grants per table for PostgREST to expose them.
-- No INSERT/UPDATE/DELETE grants for anon — those use service role only.
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON public.tenants            TO anon;
GRANT SELECT ON public.departments        TO anon;
GRANT SELECT ON public.task_categories    TO anon;
GRANT SELECT ON public.skills             TO anon;
GRANT SELECT ON public.tasks              TO anon;
GRANT SELECT ON public.coming_next        TO anon;
GRANT SELECT ON public.skill_executions   TO anon;
GRANT SELECT ON public.task_weekly_stats  TO anon;

-- authenticated mirrors anon for now (no auth flow in v3, but future-proofing).
GRANT SELECT ON public.tenants            TO authenticated;
GRANT SELECT ON public.departments        TO authenticated;
GRANT SELECT ON public.task_categories    TO authenticated;
GRANT SELECT ON public.skills             TO authenticated;
GRANT SELECT ON public.tasks              TO authenticated;
GRANT SELECT ON public.coming_next        TO authenticated;
GRANT SELECT ON public.skill_executions   TO authenticated;
GRANT SELECT ON public.task_weekly_stats  TO authenticated;

-- service_role — RLS is bypassed but table-level GRANTs are still required
-- because the Supabase project has "automatically expose new tables" OFF.
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
