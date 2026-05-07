"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { DashboardData, TasksData, DeptSlug } from "@/types/dashboard";
import * as d3Force from "d3-force";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import * as d3Drag from "d3-drag";

// ─── Node types ───────────────────────────────────────────────────────────────

type NodeKind = "centre" | "dept" | "task" | "skill";

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  label: string;
  r: number; // radius for rendering + collision
  deptSlug?: DeptSlug;
  sectorAngle?: number;
  // Task extras
  taskName?: string;
  taskStatus?: "done" | "queued" | "todo";
  taskSkillCount?: number;
  taskHoursSaved?: number | null;
  taskQueued?: boolean;
  // Skill extras
  skillName?: string;
  skillMode?: "manual" | "scheduled" | "event" | null;
  skillDrivesCount?: number;
  // Dept extras
  deptLive?: number;
  deptTotal?: number;
}

interface GraphLink extends d3Force.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  kind: "centre-dept" | "dept-task" | "task-skill";
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const TASK_COLOURS = {
  done:   { fill: "#10b981", stroke: "#047857" },  // emerald — has 1+ skills
  queued: { fill: "#fbbf24", stroke: "#d97706" },  // amber   — queued, no skills yet
  todo:   { fill: "#d1d5db", stroke: "#9ca3af" },  // neutral — not started
};

const SKILL_COLOURS: Record<string, { fill: string; stroke: string }> = {
  event:     { fill: "#10b981", stroke: "#047857" },  // emerald
  scheduled: { fill: "#fbbf24", stroke: "#d97706" },  // amber
  manual:    { fill: "#9ca3af", stroke: "#6b7280" },  // neutral
};

function taskColour(node: GraphNode) {
  if (node.taskSkillCount && node.taskSkillCount > 0) return TASK_COLOURS.done;
  if (node.taskQueued) return TASK_COLOURS.queued;
  return TASK_COLOURS.todo;
}

function skillColour(mode: string | null | undefined) {
  if (!mode) return SKILL_COLOURS.manual;
  return SKILL_COLOURS[mode] ?? SKILL_COLOURS.manual;
}

function taskRadius(skillCount: number): number {
  const r = 12 + skillCount * 6;
  return Math.min(r, 36);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ─── Build graph data ─────────────────────────────────────────────────────────

function buildGraph(
  dashboard: DashboardData,
  tasks: TasksData
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Centre node
  nodes.push({
    id: "centre",
    kind: "centre",
    label: dashboard.instance.name,
    r: 70,
  });

  const depts = tasks.departments;
  const deptCount = depts.length;

  // Collect all skill slugs across every task, building a map:
  // skillSlug -> { mode: ..., taskIds: [...] }
  const skillMap = new Map<string, { mode: string | null; taskIds: string[] }>();

  // Pre-pass: walk all tasks to collect skill data
  depts.forEach((dept) => {
    dept.tasks.forEach((task, ti) => {
      const taskId = `task-${dept.slug}-${ti}`;
      (task.automated_by ?? []).forEach((slug, si) => {
        const mode = (task.modes && task.modes[si]) ?? task.mode ?? null;
        if (!skillMap.has(slug)) {
          skillMap.set(slug, { mode, taskIds: [] });
        }
        skillMap.get(slug)!.taskIds.push(taskId);
        // If we see multiple modes, prefer event > scheduled > manual
        const existing = skillMap.get(slug)!.mode;
        if (mode === "event") skillMap.get(slug)!.mode = "event";
        else if (mode === "scheduled" && existing !== "event") skillMap.get(slug)!.mode = "scheduled";
      });
    });
  });

  // Build dept + task nodes
  depts.forEach((dept, di) => {
    const sectorAngle = -90 + di * (360 / deptCount);
    const deptId = `dept-${dept.slug}`;

    // Dept node — match data from dashboard if available, else fall back to tasks
    const dashDept = dashboard.departments.find((d) => d.slug === dept.slug);
    nodes.push({
      id: deptId,
      kind: "dept",
      label: dept.name,
      r: 50,
      deptSlug: dept.slug as DeptSlug,
      deptLive: dashDept?.automations_live ?? dept.tasks_automated,
      deptTotal: dept.tasks_total,
      sectorAngle,
    });
    links.push({ source: "centre", target: deptId, kind: "centre-dept" });

    dept.tasks.forEach((task, ti) => {
      const taskId = `task-${dept.slug}-${ti}`;
      const skillCount = (task.automated_by ?? []).length;
      const r = taskRadius(skillCount);

      // Determine visual status:
      // - "done" if it has skills automating it (regardless of task.status)
      // - "queued" if task.queued is true and no skills yet
      // - "todo" otherwise
      const visualStatus: "done" | "queued" | "todo" =
        skillCount > 0 ? "done" : task.queued ? "queued" : "todo";

      // Use short_name for the circle label (legible at small size).
      // Fall back to a truncated full name if short_name is absent.
      const circleLabel = task.short_name
        ? task.short_name
        : truncate(task.name, 17);
      nodes.push({
        id: taskId,
        kind: "task",
        label: circleLabel,
        r,
        deptSlug: dept.slug as DeptSlug,
        sectorAngle,
        taskName: task.name,       // full name — used in tooltip
        taskStatus: visualStatus,
        taskSkillCount: skillCount,
        taskHoursSaved: task.hours_saved_per_week ?? null,
        taskQueued: task.queued,
      });
      links.push({ source: deptId, target: taskId, kind: "dept-task" });
    });
  });

  // Build skill nodes + task→skill edges
  skillMap.forEach(({ mode, taskIds }, slug) => {
    const skillId = `skill-${slug}`;
    nodes.push({
      id: skillId,
      kind: "skill",
      label: truncate(slug.replace(/-/g, " "), 20),
      r: 6,
      skillName: slug,
      skillMode: mode as "manual" | "scheduled" | "event" | null,
      skillDrivesCount: taskIds.length,
    });

    taskIds.forEach((taskId) => {
      links.push({ source: taskId, target: skillId, kind: "task-skill" });
    });
  });

  return { nodes, links };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string[];
}

// ─── Mobile fallback ──────────────────────────────────────────────────────────

function MobileFallback({ data, tasksData }: { data: DashboardData; tasksData: TasksData }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center pb-4 border-b border-neutral-100">
        <Image
          src="/minimise-logo.png"
          alt={data.instance.name}
          width={120}
          height={28}
          className="h-8 w-auto mb-2"
        />
        <p className="text-xs text-ink-muted">
          {data.stats.automations_live} automations live
        </p>
      </div>
      {tasksData.departments.map((dept) => (
        <div key={dept.slug} className="border border-neutral-100 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-ink">{dept.name}</span>
            <span className="text-xs text-ink-muted">
              {dept.tasks_automated} automated · {dept.tasks_total} tasks
            </span>
          </div>
          <ul className="space-y-1.5">
            {dept.tasks.map((task) => {
              const skillCount = (task.automated_by ?? []).length;
              const colour =
                skillCount > 0
                  ? TASK_COLOURS.done.fill
                  : task.queued
                  ? TASK_COLOURS.queued.fill
                  : TASK_COLOURS.todo.fill;
              return (
                <li key={task.name} className="flex items-center gap-2 text-xs text-ink">
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{ width: 8, height: 8, backgroundColor: colour }}
                  />
                  <span className="truncate">{task.name}</span>
                  {skillCount > 0 && (
                    <span className="text-ink-muted ml-auto shrink-0">
                      {skillCount} skill{skillCount > 1 ? "s" : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MindMap({
  data,
  tasksData,
}: {
  data: DashboardData;
  tasksData: TasksData;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simRef = useRef<d3Force.Simulation<GraphNode, GraphLink> | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const zoomTransformRef = useRef<d3Zoom.ZoomTransform>(d3Zoom.zoomIdentity);
  const mouseMoveActiveRef = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: [],
  });
  const [dims, setDims] = useState({ w: 900, h: 600 });

  // Build graph once
  const { nodes: initialNodes, links: initialLinks } = useMemo(
    () => buildGraph(data, tasksData),
    [data, tasksData]
  );

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
  }, []);

  // Resize observer
  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({
          w: entry.contentRect.width || 900,
          h: entry.contentRect.height || 600,
        });
      }
    });
    ro.observe(svgRef.current.parentElement || svgRef.current);
    return () => ro.disconnect();
  }, []);

  const buildTooltipContent = useCallback((node: GraphNode): string[] => {
    switch (node.kind) {
      case "task": {
        const parts: string[] = [node.taskName ?? node.label];
        if ((node.taskSkillCount ?? 0) > 0) {
          parts.push(`${node.taskSkillCount} skill${node.taskSkillCount === 1 ? "" : "s"} automating it`);
          if (node.taskHoursSaved != null)
            parts.push(`${node.taskHoursSaved}h saved/wk`);
        } else if (node.taskQueued) {
          parts.push("queued — no skill yet");
        } else {
          parts.push("not yet automated");
        }
        return parts;
      }
      case "skill": {
        const parts: string[] = [node.skillName ?? node.label];
        if (node.skillMode) parts.push(`mode: ${node.skillMode}`);
        if (node.skillDrivesCount != null)
          parts.push(`drives ${node.skillDrivesCount} task${node.skillDrivesCount === 1 ? "" : "s"}`);
        return parts;
      }
      case "dept":
        return [
          node.label,
          `${node.deptLive ?? 0} live · ${node.deptTotal ?? 0} total tasks`,
        ];
      default:
        return [node.label];
    }
  }, []);

  // D3 setup — runs once on mount/resize (client only)
  useEffect(() => {
    if (isMobile || !svgRef.current || !gRef.current) return;

    const svg = d3Selection.select(svgRef.current);
    const g = d3Selection.select(gRef.current);

    // Clear previous render
    g.selectAll("*").remove();

    // Deep-clone nodes/links so d3 can mutate them
    const nodes: GraphNode[] = initialNodes.map((n) => ({ ...n }));
    const links: GraphLink[] = initialLinks.map((l) => ({
      source: l.source,
      target: l.target,
      kind: l.kind,
    }));

    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;

    const SECTOR_R = Math.min(w, h) * 0.26;
    const TASK_R = Math.min(w, h) * 0.42;

    // ─── Mouse force ─────────────────────────────────────────────────────────
    function mouseForce(alpha: number) {
      if (!mousePos.current) return;
      const mp = mousePos.current;
      nodes.forEach((node) => {
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        const dx = nx - mp.x;
        const dy = ny - mp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const RADIUS = 160;
        if (dist > 0 && dist < RADIUS) {
          const strength = (RADIUS - dist) * 0.04 * alpha;
          node.vx = (node.vx ?? 0) + (dx / dist) * strength;
          node.vy = (node.vy ?? 0) + (dy / dist) * strength;
        }
      });
    }

    // ─── Simulation ──────────────────────────────────────────────────────────
    const sim = d3Force
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3Force
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            switch (l.kind) {
              case "centre-dept": return 200;
              case "dept-task":   return 100;
              case "task-skill":  return 50;
              default:            return 80;
            }
          })
          .strength(0.55)
      )
      .force("charge", d3Force.forceManyBody().strength(-180))
      .force("center", d3Force.forceCenter(cx, cy).strength(0.04))
      .force(
        "collide",
        d3Force.forceCollide<GraphNode>()
          .radius((d) => d.r + 4)
          .strength(0.7)
      )
      // Sector anchoring: dept nodes orbit at SECTOR_R, tasks at TASK_R (weaker)
      .force(
        "sectorX",
        d3Force
          .forceX<GraphNode>((d) => {
            if (d.kind === "centre") return cx;
            if (d.kind === "dept" && d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cx + SECTOR_R * Math.cos(rad);
            }
            if (d.kind === "task" && d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cx + TASK_R * Math.cos(rad);
            }
            return cx;
          })
          .strength((d) => {
            if (d.kind === "centre") return 0.6;
            if (d.kind === "dept") return 0.3;
            if (d.kind === "task") return 0.05;
            return 0;
          })
      )
      .force(
        "sectorY",
        d3Force
          .forceY<GraphNode>((d) => {
            if (d.kind === "centre") return cy;
            if (d.kind === "dept" && d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cy + SECTOR_R * Math.sin(rad);
            }
            if (d.kind === "task" && d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cy + TASK_R * Math.sin(rad);
            }
            return cy;
          })
          .strength((d) => {
            if (d.kind === "centre") return 0.6;
            if (d.kind === "dept") return 0.3;
            if (d.kind === "task") return 0.05;
            return 0;
          })
      )
      .force("mouse", mouseForce)
      .alphaDecay(0.02);

    simRef.current = sim;

    // ─── Render links ────────────────────────────────────────────────────────
    const linkSel = g
      .selectAll<SVGLineElement, GraphLink>("line.link")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("stroke", (l) => {
        switch (l.kind) {
          case "centre-dept": return "#d1d5db";
          case "dept-task":   return "#e5e7eb";
          case "task-skill":  return "#f3f4f6";
          default:            return "#e5e7eb";
        }
      })
      .attr("stroke-width", (l) => {
        switch (l.kind) {
          case "centre-dept": return 1.5;
          case "dept-task":   return 1;
          case "task-skill":  return 0.75;
          default:            return 1;
        }
      });

    // ─── Render nodes ────────────────────────────────────────────────────────
    const nodeSel = g
      .selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .style("cursor", "grab");

    nodeSel.each(function (d) {
      const el = d3Selection.select(this);
      el.selectAll("*").remove();

      switch (d.kind) {
        case "centre": {
          const W = 140, H = 56;
          el.append("rect")
            .attr("x", -W / 2)
            .attr("y", -H / 2)
            .attr("width", W)
            .attr("height", H)
            .attr("rx", 4)
            .attr("fill", "white")
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1.5);

          const fo = el
            .append("foreignObject")
            .attr("x", -W / 2 + 10)
            .attr("y", -H / 2 + 8)
            .attr("width", W - 20)
            .attr("height", 26);
          const div = fo
            .append("xhtml:div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("height", "100%");
          div
            .append("xhtml:img")
            .attr("src", "/minimise-logo.png")
            .attr("alt", d.label)
            .style("height", "20px")
            .style("width", "auto")
            .style("object-fit", "contain");

          el.append("text")
            .attr("y", H / 2 - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", 7.5)
            .attr("fill", "#9ca3af")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("font-weight", 500)
            .attr("letter-spacing", "0.07em")
            .style("text-transform", "uppercase")
            .text("AIOS");
          break;
        }

        case "dept": {
          const W = 100, H = 36;
          el.append("rect")
            .attr("x", -W / 2)
            .attr("y", -H / 2)
            .attr("width", W)
            .attr("height", H)
            .attr("rx", 3)
            .attr("fill", "white")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1);

          el.append("text")
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("font-weight", 600)
            .attr("fill", "#1c1c1e")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .text(d.label);

          el.append("text")
            .attr("y", 9)
            .attr("text-anchor", "middle")
            .attr("font-size", 7.5)
            .attr("fill", "#9ca3af")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .text(`${d.deptLive ?? 0} live · ${d.deptTotal ?? 0} tasks`);
          break;
        }

        case "task": {
          const r = d.r;
          const colours = taskColour(d);
          el.append("circle")
            .attr("r", r)
            .attr("fill", colours.fill)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

          el.append("text")
            .attr("y", r + 11)
            .attr("text-anchor", "middle")
            .attr("font-size", 9)
            .attr("fill", "#374151")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("pointer-events", "none")
            .text(d.label);
          break;
        }

        case "skill": {
          const r = d.r;
          const colours = skillColour(d.skillMode);
          el.append("circle")
            .attr("r", r)
            .attr("fill", colours.fill)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);

          el.append("text")
            .attr("y", r + 9)
            .attr("text-anchor", "middle")
            .attr("font-size", 7.5)
            .attr("fill", "#6b7280")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("pointer-events", "none")
            .text(d.label);
          break;
        }
      }
    });

    // ─── Hover tooltip ───────────────────────────────────────────────────────
    nodeSel
      .on("mouseenter", function (event: MouseEvent, d: GraphNode) {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        setTooltip({
          visible: true,
          x: event.clientX - svgRect.left + 14,
          y: event.clientY - svgRect.top + 14,
          content: buildTooltipContent(d),
        });
      })
      .on("mousemove", function (event: MouseEvent) {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - svgRect.left + 14,
          y: event.clientY - svgRect.top + 14,
        }));
      })
      .on("mouseleave", () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // ─── Drag ────────────────────────────────────────────────────────────────
    const drag = d3Drag
      .drag<SVGGElement, GraphNode>()
      .on("start", function (event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3Selection.select(this).style("cursor", "grabbing");
      })
      .on("drag", function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function (event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3Selection.select(this).style("cursor", "grab");
      });

    nodeSel.call(drag);

    // ─── Zoom / pan ──────────────────────────────────────────────────────────
    const zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        zoomTransformRef.current = event.transform;
        g.attr("transform", event.transform.toString());
      })
      .filter((event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "mousedown") {
          const target = event.target as SVGElement;
          if (target.closest && target.closest(".node")) return false;
        }
        return true;
      });

    svg.call(zoom);

    // ─── Mouse tracking ──────────────────────────────────────────────────────
    // onMouseMove is handled via React prop on SVG — we update mousePos.current
    // and bump alphaTarget so the simulation stays warm while moving.
    // (See onMouseMove on the SVG element below — it calls updateMousePos)

    // ─── Simulation tick ─────────────────────────────────────────────────────
    sim.on("tick", () => {
      linkSel
        .attr("x1", (l) => (l.source as GraphNode).x ?? 0)
        .attr("y1", (l) => (l.source as GraphNode).y ?? 0)
        .attr("x2", (l) => (l.target as GraphNode).x ?? 0)
        .attr("y2", (l) => (l.target as GraphNode).y ?? 0);

      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    setReady(true);

    return () => {
      sim.stop();
      svg.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, dims.w, dims.h]);

  // Handle mouse move on the SVG — convert to graph coords, update force
  const handleSvgMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const t = zoomTransformRef.current;
    // Invert zoom transform to get graph-space coords
    const gx = (event.clientX - svgRect.left - t.x) / t.k;
    const gy = (event.clientY - svgRect.top - t.y) / t.k;

    mousePos.current = { x: gx, y: gy };

    if (!mouseMoveActiveRef.current && simRef.current) {
      mouseMoveActiveRef.current = true;
      simRef.current.alphaTarget(0.05).restart();
    }
  }, []);

  const handleSvgMouseLeave = useCallback(() => {
    mousePos.current = null;
    mouseMoveActiveRef.current = false;
    if (simRef.current) {
      simRef.current.alphaTarget(0);
    }
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  if (isMobile) {
    return <MobileFallback data={data} tasksData={tasksData} />;
  }

  return (
    <div className="relative w-full" style={{ height: "80vh" }}>
      {/* Legend — bottom-left, fixed relative to SVG container */}
      <div
        className="absolute bottom-4 left-4 z-10 bg-white border border-neutral-200 rounded p-2.5 shadow-sm"
        style={{ pointerEvents: "none" }}
      >
        <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-2">
          Legend
        </p>
        {/* Task size row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] text-neutral-500">▣ Task</span>
          <span className="text-[9px] text-neutral-400">bigger = more automated</span>
        </div>
        {/* Skill colour rows */}
        {[
          { color: SKILL_COLOURS.event.fill,     label: "Skill (event)" },
          { color: SKILL_COLOURS.scheduled.fill, label: "Skill (scheduled)" },
          { color: SKILL_COLOURS.manual.fill,    label: "Skill (manual)" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 7, height: 7, backgroundColor: color }}
            />
            <span className="text-[9px] text-neutral-500">{label}</span>
          </div>
        ))}
        {/* Task status colour rows */}
        {[
          { color: TASK_COLOURS.done.fill,   label: "Task — automated" },
          { color: TASK_COLOURS.queued.fill, label: "Task — queued" },
          { color: TASK_COLOURS.todo.fill,   label: "Task — todo" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 7, height: 7, backgroundColor: color }}
            />
            <span className="text-[9px] text-neutral-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-20 bg-white border border-neutral-200 rounded shadow-sm p-2 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 240 }}
        >
          {tooltip.content.map((line, i) => (
            <p
              key={i}
              className={`text-[10px] ${i === 0 ? "font-semibold text-neutral-800" : "text-neutral-500"}`}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        aria-label="Minimise AIOS mind map — tasks as primary nodes, sized by automation count"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}
        onMouseMove={handleSvgMouseMove}
        onMouseLeave={handleSvgMouseLeave}
      >
        <g ref={gRef} />
      </svg>
    </div>
  );
}
