#!/usr/bin/env python3
"""Import brain YAMLs into the AIOS dashboard Supabase project for one tenant.

Reads:
  ~/Desktop/minimise-brain/dashboard-data/dept-mapping.yml
  ~/Desktop/minimise-brain/dashboard-data/skills.yml
  ~/Desktop/minimise-brain/dashboard-data/tasks.yml
  ~/Desktop/minimise-brain/.claude/plans/automation-backlog.md

Writes to the Supabase project pointed at by ~/.minimise/aios-supabase.env:
  - tenants               (1 row for Minimise)
  - departments           (6 dashboard depts from dept-mapping.yml)
  - task_categories       (categories nested under each dept)
  - skills                (one per row in skills.yml)
  - tasks                 (one per row in tasks.yml — no executions_per_week)
  - coming_next           (top 5 S-leverage items from automation-backlog.md)

Idempotent: every row's primary key is a UUIDv5 derived from
(tenant_id, namespace, slug). Re-running the importer upserts (PostgREST
`Prefer: resolution=merge-duplicates` on conflict columns).

Auth: uses the SERVICE_ROLE key to bypass RLS for INSERT/UPSERT.
Plain `requests` + `pyyaml`, no MCP, no Supabase SDK.

Exit codes:
  0  - all upserts succeeded
  1  - any HTTP non-2xx from PostgREST, or missing env vars
"""

from __future__ import annotations

import json
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any

import requests
import yaml

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
HOME = Path.home()
BRAIN = HOME / "Desktop" / "minimise-brain"
ENV_FILE = HOME / ".minimise" / "aios-supabase.env"

DEPT_MAPPING_PATH = BRAIN / "dashboard-data" / "dept-mapping.yml"
SKILLS_PATH = BRAIN / "dashboard-data" / "skills.yml"
TASKS_PATH = BRAIN / "dashboard-data" / "tasks.yml"
BACKLOG_PATH = BRAIN / ".claude" / "plans" / "automation-backlog.md"

# A stable namespace UUID used to derive deterministic row IDs from
# (tenant_id, kind, slug). Pinned constant — never change.
ROW_NS = uuid.UUID("a1f4d6c8-7b3e-4b9a-9f1e-1c2d3e4f5061")


# ---------------------------------------------------------------------------
# Env file parsing (plain KEY=VALUE, no python-dotenv dep)
# ---------------------------------------------------------------------------
def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        die(f"env file not found: {path}")
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key:
            env[key] = val
    return env


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Deterministic UUIDs
# ---------------------------------------------------------------------------
def row_id(tenant_id: str, kind: str, slug: str) -> str:
    return str(uuid.uuid5(ROW_NS, f"{tenant_id}|{kind}|{slug}"))


# ---------------------------------------------------------------------------
# PostgREST client
# ---------------------------------------------------------------------------
class Supabase:
    def __init__(self, url: str, service_role_key: str) -> None:
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    def upsert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        on_conflict: str,
    ) -> None:
        """Upsert via PostgREST merge-duplicates."""
        if not rows:
            return
        endpoint = f"{self.url}/rest/v1/{table}?on_conflict={on_conflict}"
        headers = dict(self.headers)
        headers["Prefer"] = "resolution=merge-duplicates,return=minimal"
        resp = requests.post(endpoint, headers=headers, data=json.dumps(rows), timeout=60)
        if resp.status_code >= 300:
            die(
                f"upsert to {table} failed: HTTP {resp.status_code}\n"
                f"body: {resp.text}\n"
                f"rows[0]: {rows[0] if rows else 'EMPTY'}"
            )
        print(f"  upserted {len(rows):>3} into {table}")


# ---------------------------------------------------------------------------
# Backlog parser
# ---------------------------------------------------------------------------
HEADER_TO_DASH_DEPT = {
    "high-priority — locks in aios phase 5+": "operations",
    "sales": "sales",
    "marketing": "marketing",
    "relationships": "delivery",
    "finance": "finance",
    "product / dev": "development",
    "cross-cutting / operations": "operations",
}


def parse_backlog_s_leverage(path: Path) -> list[dict[str, str]]:
    """Return S-leverage rows from automation-backlog.md, top 5.

    Each row: {task, dept_slug, leverage, source_doc}.
    """
    if not path.exists():
        print(f"  warning: backlog file missing: {path}", file=sys.stderr)
        return []

    items: list[dict[str, str]] = []
    current_dept = "operations"  # safe default

    for raw in path.read_text().splitlines():
        stripped = raw.strip()
        if stripped.startswith("##"):
            header = stripped.lstrip("# ").strip().lower()
            if header in HEADER_TO_DASH_DEPT:
                current_dept = HEADER_TO_DASH_DEPT[header]
            continue

        # Markdown table rows look like: | Task name | S | Backlog | notes |
        if not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cells) < 3:
            continue
        # Skip header / separator rows.
        if cells[0].lower() in {"task", ""} or set(cells[0]) <= {"-", ":"}:
            continue
        task = cells[0]
        leverage = cells[1].strip()
        if leverage != "S":
            continue
        if task.startswith("(") or "none yet" in task.lower():
            continue
        items.append(
            {
                "task": task,
                "dept_slug": current_dept,
                "leverage": "S",
                "source_doc": "automation-backlog.md",
            }
        )
        if len(items) >= 5:
            break
    return items


# ---------------------------------------------------------------------------
# Main importer
# ---------------------------------------------------------------------------
def main() -> None:
    env = load_env_file(ENV_FILE)
    url = env.get("AIOS_SUPABASE_URL") or die("AIOS_SUPABASE_URL missing")
    key = env.get("AIOS_SUPABASE_SERVICE_ROLE_KEY") or die(
        "AIOS_SUPABASE_SERVICE_ROLE_KEY missing"
    )
    tenant_id = env.get("MINIMISE_TENANT_ID") or die("MINIMISE_TENANT_ID missing")

    sb = Supabase(url, key)

    # -----------------------------------------------------------------------
    # Load YAMLs
    # -----------------------------------------------------------------------
    print("→ loading YAMLs")
    dept_mapping = yaml.safe_load(DEPT_MAPPING_PATH.read_text())
    skills_data = yaml.safe_load(SKILLS_PATH.read_text())
    tasks_data = yaml.safe_load(TASKS_PATH.read_text())

    dashboard_depts = dept_mapping["dashboard_departments"]

    # Map every brain-dept slug → dashboard-dept slug (e.g. "consulting" → "delivery").
    brain_to_dash: dict[str, str] = {}
    for dd in dashboard_depts:
        for brain_slug in dd.get("brain_depts", []):
            brain_to_dash[brain_slug] = dd["slug"]
    # Cross-cutting falls under operations.
    brain_to_dash.setdefault("cross-cutting", "operations")

    # -----------------------------------------------------------------------
    # Tenants
    # -----------------------------------------------------------------------
    print("→ upserting tenant")
    tenant_row = {
        "id": tenant_id,
        "slug": "minimise",
        "name": "Minimise",
        "tagline": "Building the AIOS in public",
        "logo_path": "/logo.svg",
    }
    sb.upsert("tenants", [tenant_row], on_conflict="slug")

    # -----------------------------------------------------------------------
    # Departments
    # -----------------------------------------------------------------------
    print("→ upserting departments")
    dept_rows: list[dict[str, Any]] = []
    dept_id_by_slug: dict[str, str] = {}
    for i, dd in enumerate(dashboard_depts):
        dept_id = row_id(tenant_id, "department", dd["slug"])
        dept_id_by_slug[dd["slug"]] = dept_id
        dept_rows.append(
            {
                "id": dept_id,
                "tenant_id": tenant_id,
                "slug": dd["slug"],
                "name": dd["name"],
                "display_order": i,
                "dashboard_dept": dd["slug"],
            }
        )
    sb.upsert("departments", dept_rows, on_conflict="tenant_id,slug")

    # -----------------------------------------------------------------------
    # Task categories
    # -----------------------------------------------------------------------
    print("→ upserting task categories")
    cat_rows: list[dict[str, Any]] = []
    cat_id_by_key: dict[tuple[str, str], str] = {}
    for dd in dashboard_depts:
        dept_slug = dd["slug"]
        dept_id = dept_id_by_slug[dept_slug]
        for i, cat_name in enumerate(dd.get("categories", [])):
            key = (dept_slug, cat_name)
            cat_id = row_id(tenant_id, "task_category", f"{dept_slug}|{cat_name}")
            cat_id_by_key[key] = cat_id
            cat_rows.append(
                {
                    "id": cat_id,
                    "tenant_id": tenant_id,
                    "department_id": dept_id,
                    "name": cat_name,
                    "display_order": i,
                }
            )
    sb.upsert(
        "task_categories",
        cat_rows,
        on_conflict="tenant_id,department_id,name",
    )

    # -----------------------------------------------------------------------
    # Skills
    # -----------------------------------------------------------------------
    print("→ upserting skills")
    skill_rows: list[dict[str, Any]] = []
    skill_id_by_slug: dict[str, str] = {}
    for s in skills_data:
        slug = s["skill"]
        skill_id = row_id(tenant_id, "skill", slug)
        skill_id_by_slug[slug] = skill_id

        brain_dept = s.get("department")
        dash_dept_slug = brain_to_dash.get(brain_dept)
        dept_id = dept_id_by_slug.get(dash_dept_slug) if dash_dept_slug else None

        linked_assets = s.get("linked_assets") or []

        skill_rows.append(
            {
                "id": skill_id,
                "tenant_id": tenant_id,
                "slug": slug,
                "display_name": s.get("display_name") or slug,
                "description": s.get("description") or "",
                "department_id": dept_id,
                "status": s.get("status") or "live",
                "mode": s.get("mode") or "manual",
                "linked_assets": linked_assets,
                "notes": s.get("notes") or "",
            }
        )
    sb.upsert("skills", skill_rows, on_conflict="tenant_id,slug")

    # -----------------------------------------------------------------------
    # Tasks
    # -----------------------------------------------------------------------
    print("→ upserting tasks")
    task_rows: list[dict[str, Any]] = []
    skipped_tasks: list[str] = []
    for t in tasks_data:
        name = t["name"]
        brain_dept = t.get("department")
        dash_dept_slug = brain_to_dash.get(brain_dept)
        if not dash_dept_slug:
            skipped_tasks.append(f"{name} (unknown brain dept: {brain_dept})")
            continue
        dept_id = dept_id_by_slug.get(dash_dept_slug)

        category_name = t.get("category")
        category_id = cat_id_by_key.get((dash_dept_slug, category_name)) if category_name else None
        if category_name and not category_id:
            # Category not declared for this dept — surface but don't fail.
            skipped_tasks.append(
                f"{name} (category '{category_name}' not declared under '{dash_dept_slug}')"
            )

        automated_by_slugs = t.get("automated_by") or []
        automated_by_uuids = [
            skill_id_by_slug[slug_]
            for slug_ in automated_by_slugs
            if slug_ in skill_id_by_slug
        ]

        task_rows.append(
            {
                "id": row_id(tenant_id, "task", name),
                "tenant_id": tenant_id,
                "name": name,
                "short_name": t.get("short_name") or "",
                "department_id": dept_id,
                "category_id": category_id,
                "importance": t.get("importance") or "medium",
                "queued": bool(t.get("queued", False)),
                "manual_minutes_per_execution": t.get("manual_minutes_per_execution"),
                "automated_minutes_per_execution": t.get("automated_minutes_per_execution"),
                "automated_by": automated_by_uuids,
            }
        )
    sb.upsert("tasks", task_rows, on_conflict="tenant_id,name")
    if skipped_tasks:
        print("  notes (non-fatal):")
        for s_ in skipped_tasks:
            print(f"    - {s_}")

    # -----------------------------------------------------------------------
    # coming_next — top 5 S-leverage backlog items
    # -----------------------------------------------------------------------
    print("→ upserting coming_next")
    backlog = parse_backlog_s_leverage(BACKLOG_PATH)
    cn_rows: list[dict[str, Any]] = []
    for i, item in enumerate(backlog):
        dept_id = dept_id_by_slug.get(item["dept_slug"])
        cn_rows.append(
            {
                "id": row_id(tenant_id, "coming_next", item["task"]),
                "tenant_id": tenant_id,
                "task_name": item["task"],
                "department_id": dept_id,
                "leverage": item["leverage"],
                "display_order": i,
                "source_doc": item["source_doc"],
            }
        )
    sb.upsert("coming_next", cn_rows, on_conflict="tenant_id,task_name")

    print("\n✓ import complete")
    print(f"  tenant:           1")
    print(f"  departments:      {len(dept_rows)}")
    print(f"  task_categories:  {len(cat_rows)}")
    print(f"  skills:           {len(skill_rows)}")
    print(f"  tasks:            {len(task_rows)}")
    print(f"  coming_next:      {len(cn_rows)}")


if __name__ == "__main__":
    main()
