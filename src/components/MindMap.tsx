"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { DashboardData, TasksData, DeptSlug } from "@/types/dashboard";
import * as d3Force from "d3-force";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import * as d3Drag from "d3-drag";

// ─── Node types ───────────────────────────────────────────────────────────────

type NodeKind = "centre" | "dept" | "automation" | "queued" | "manual";

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  label: string;
  deptSlug?: DeptSlug;
  // Per-kind extras
  automationName?: string;
  automationSkill?: string;
  automationHours?: number;
  queuedLeverage?: string;
  manualHours?: number | null;
  // dept extras
  deptLive?: number;
  deptTotal?: number;
  // sector angle for forceX/Y anchoring
  sectorAngle?: number;
}

interface GraphLink extends d3Force.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const COLOURS = {
  automation: { fill: "#10b981", stroke: "#047857" },   // emerald-500
  queued:     { fill: "#fbbf24", stroke: "#d97706" },   // amber-300 / amber-600
  manual:     { fill: "#d1d5db", stroke: "#9ca3af" },   // neutral-300 / neutral-400
};

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

  // Centre
  nodes.push({ id: "centre", kind: "centre", label: dashboard.instance.name });

  const depts = dashboard.departments;
  const deptCount = depts.length;

  // Build a set of coming_next names (lowercased) for dedup
  const comingNextNames = new Set(
    dashboard.coming_next.map((c) => c.name.toLowerCase().trim())
  );

  depts.forEach((dept, di) => {
    // Evenly space departments in a circle; start from top (−90°)
    const sectorAngle = -90 + di * (360 / deptCount);
    const deptId = `dept-${dept.slug}`;

    nodes.push({
      id: deptId,
      kind: "dept",
      label: dept.name,
      deptSlug: dept.slug as DeptSlug,
      deptLive: dept.automations_live,
      deptTotal: dept.tasks_total,
      sectorAngle,
    });

    links.push({ source: "centre", target: deptId });

    // Live automation nodes
    dept.automations.forEach((auto) => {
      const autoId = `auto-${dept.slug}-${auto.skill}`;
      nodes.push({
        id: autoId,
        kind: "automation",
        label: truncate(auto.name, 22),
        deptSlug: dept.slug as DeptSlug,
        automationName: auto.name,
        automationSkill: auto.skill,
        automationHours: auto.hours_per_week,
        sectorAngle,
      });
      links.push({ source: deptId, target: autoId });
    });

    // Queued (coming_next) nodes for this dept
    dashboard.coming_next
      .filter((c) => c.department === dept.slug)
      .forEach((item, qi) => {
        const queuedId = `queued-${dept.slug}-${qi}`;
        nodes.push({
          id: queuedId,
          kind: "queued",
          label: truncate(item.name, 22),
          deptSlug: dept.slug as DeptSlug,
          automationName: item.name,
          queuedLeverage: item.leverage,
          sectorAngle,
        });
        links.push({ source: deptId, target: queuedId });
      });

    // Manual task nodes — from tasks.json, not automated, not in coming_next
    // Defensive: handle both old string|null shape and new string[] shape
    const taskDept = tasks.departments.find((td) => td.slug === dept.slug);
    if (taskDept) {
      taskDept.tasks
        .filter(
          (t) => {
            const ab = t.automated_by;
            const isAutomated = Array.isArray(ab) ? ab.length > 0 : ab !== null;
            return !isAutomated && !comingNextNames.has(t.name.toLowerCase().trim());
          }
        )
        .forEach((task, ti) => {
          const manualId = `manual-${dept.slug}-${ti}`;
          nodes.push({
            id: manualId,
            kind: "manual",
            label: truncate(task.name, 22),
            deptSlug: dept.slug as DeptSlug,
            automationName: task.name,
            manualHours: task.manual_hours_per_week ?? task.hours_per_week,
            sectorAngle,
          });
          links.push({ source: deptId, target: manualId });
        });
    }
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

function MobileFallback({ data }: { data: DashboardData }) {
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
      {data.departments.map((dept) => (
        <div key={dept.slug} className="border border-neutral-100 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-ink">{dept.name}</span>
            <span className="text-xs text-ink-muted">
              {dept.automations_live} live · {dept.tasks_total} tasks
            </span>
          </div>
          {dept.automations.length === 0 ? (
            <p className="text-xs text-ink-muted italic">No automations yet</p>
          ) : (
            <ul className="space-y-1.5">
              {dept.automations.map((auto) => (
                <li key={auto.skill} className="flex items-center gap-2 text-xs text-ink">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLOURS.automation.fill }}
                  />
                  {auto.name}
                  <span className="text-ink-muted ml-auto">{auto.status}</span>
                </li>
              ))}
            </ul>
          )}
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
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: [],
  });

  // Build graph once
  const { nodes: initialNodes, links: initialLinks } = useMemo(
    () => buildGraph(data, tasksData),
    [data, tasksData]
  );

  // Refs for stable closure access
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const [dims, setDims] = useState({ w: 900, h: 600 });

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        handler as (e: MediaQueryListEvent) => void
      );
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
      case "automation": {
        const parts = [node.automationName ?? node.label];
        if (node.automationSkill) parts.push(`skill: ${node.automationSkill}`);
        if (node.automationHours != null)
          parts.push(`${node.automationHours}h saved/wk`);
        else parts.push("live");
        return parts;
      }
      case "queued":
        return [
          node.automationName ?? node.label,
          `queued · leverage ${node.queuedLeverage ?? "?"}`,
        ];
      case "manual": {
        const parts = [node.automationName ?? node.label, "manual · not yet automated"];
        if (node.manualHours != null)
          parts.push(`~${node.manualHours}h/wk`);
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

  // D3 setup — runs once on mount (client only)
  useEffect(() => {
    if (isMobile || !svgRef.current || !gRef.current) return;

    const svg = d3Selection.select(svgRef.current);
    const g = d3Selection.select(gRef.current);

    // Deep-clone nodes so d3 can mutate them
    const nodes: GraphNode[] = initialNodes.map((n) => ({ ...n }));
    const links: GraphLink[] = initialLinks.map((l) => ({
      source: l.source,
      target: l.target,
    }));
    nodesRef.current = nodes;
    linksRef.current = links;

    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;

    // Sector anchoring radius — depts orbit ~200px from centre, children a bit further
    const SECTOR_R = Math.min(w, h) * 0.28;
    const CHILD_R = Math.min(w, h) * 0.44;

    const sim = d3Force
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3Force
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            const s = l.source as GraphNode;
            const t = l.target as GraphNode;
            if (s.kind === "centre" || t.kind === "centre") return 160;
            if (s.kind === "dept" || t.kind === "dept") return 80;
            return 60;
          })
          .strength(0.6)
      )
      .force("charge", d3Force.forceManyBody().strength(-120))
      .force("center", d3Force.forceCenter(cx, cy).strength(0.05))
      .force(
        "collide",
        d3Force.forceCollide<GraphNode>().radius((d) => {
          if (d.kind === "centre") return 80;
          if (d.kind === "dept") return 64;
          if (d.kind === "automation") return 22;
          if (d.kind === "queued") return 18;
          return 16;
        })
      )
      // Pull dept nodes toward their sector positions
      .force(
        "sectorX",
        d3Force
          .forceX<GraphNode>((d) => {
            if (d.kind === "centre") return cx;
            if (d.kind === "dept" && d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cx + SECTOR_R * Math.cos(rad);
            }
            if (d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cx + CHILD_R * Math.cos(rad);
            }
            return cx;
          })
          .strength((d) => {
            if (d.kind === "centre") return 0.5;
            if (d.kind === "dept") return 0.25;
            return 0.06;
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
            if (d.sectorAngle != null) {
              const rad = (d.sectorAngle * Math.PI) / 180;
              return cy + CHILD_R * Math.sin(rad);
            }
            return cy;
          })
          .strength((d) => {
            if (d.kind === "centre") return 0.5;
            if (d.kind === "dept") return 0.25;
            return 0.06;
          })
      )
      .alphaDecay(0.025);

    simRef.current = sim;

    // ─── Render links ───────────────────────────────────────────────────────

    const linkSel = g
      .selectAll<SVGLineElement, GraphLink>("line.link")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);

    // ─── Render nodes ───────────────────────────────────────────────────────

    const nodeSel = g
      .selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .style("cursor", "grab");

    // Draw per-kind visuals
    nodeSel.each(function (d) {
      const el = d3Selection.select(this);
      // Clear any previous children (re-render on update)
      el.selectAll("*").remove();

      switch (d.kind) {
        case "centre": {
          const W = 140, H = 60;
          el.append("rect")
            .attr("x", -W / 2)
            .attr("y", -H / 2)
            .attr("width", W)
            .attr("height", H)
            .attr("rx", 4)
            .attr("fill", "white")
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1.5);

          // Logo via foreignObject
          const fo = el
            .append("foreignObject")
            .attr("x", -W / 2 + 10)
            .attr("y", -H / 2 + 10)
            .attr("width", W - 20)
            .attr("height", 28);
          const div = fo
            .append("xhtml:div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("height", "100%");
          div
            .append("xhtml:img")
            .attr("src", "/minimise-logo.png")
            .attr("alt", d.label)
            .style("height", "22px")
            .style("width", "auto")
            .style("object-fit", "contain");

          el.append("text")
            .attr("y", H / 2 - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", 8.5)
            .attr("fill", "#9ca3af")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("font-weight", 500)
            .attr("letter-spacing", "0.06em")
            .style("text-transform", "uppercase")
            .text(d.label);
          break;
        }
        case "dept": {
          const W = 110, H = 40;
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
            .attr("y", -6)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("font-weight", 600)
            .attr("fill", "#1c1c1e")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .text(d.label);

          el.append("text")
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("font-size", 8.5)
            .attr("fill", "#9ca3af")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .text(`${d.deptLive ?? 0} live · ${d.deptTotal ?? 0} total`);
          break;
        }
        case "automation": {
          const r = 10;
          el.append("circle")
            .attr("r", r)
            .attr("fill", COLOURS.automation.fill)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

          el.append("text")
            .attr("y", r + 12)
            .attr("text-anchor", "middle")
            .attr("font-size", 8.5)
            .attr("fill", "#374151")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("pointer-events", "none")
            .text(d.label);
          break;
        }
        case "queued": {
          const r = 8;
          el.append("circle")
            .attr("r", r)
            .attr("fill", COLOURS.queued.fill)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

          el.append("text")
            .attr("y", r + 11)
            .attr("text-anchor", "middle")
            .attr("font-size", 8)
            .attr("fill", "#6b7280")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("pointer-events", "none")
            .text(d.label);
          break;
        }
        case "manual": {
          const r = 6;
          el.append("circle")
            .attr("r", r)
            .attr("fill", COLOURS.manual.fill)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

          el.append("text")
            .attr("y", r + 10)
            .attr("text-anchor", "middle")
            .attr("font-size", 8)
            .attr("fill", "#9ca3af")
            .attr("font-family", "var(--font-sans, ui-sans-serif)")
            .attr("pointer-events", "none")
            .text(d.label);
          break;
        }
      }
    });

    // ─── Hover tooltip ──────────────────────────────────────────────────────

    nodeSel
      .on("mouseenter", function (event: MouseEvent, d: GraphNode) {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        setTooltip({
          visible: true,
          x: event.clientX - svgRect.left + 12,
          y: event.clientY - svgRect.top + 12,
          content: buildTooltipContent(d),
        });
        d3Selection.select(this).style("cursor", "grab");
      })
      .on("mousemove", function (event: MouseEvent) {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - svgRect.left + 12,
          y: event.clientY - svgRect.top + 12,
        }));
      })
      .on("mouseleave", () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // ─── Drag ───────────────────────────────────────────────────────────────

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

    // ─── Zoom / pan ─────────────────────────────────────────────────────────

    const zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      })
      .filter((event) => {
        // Disable double-click zoom; allow wheel + drag on svg background
        if (event.type === "dblclick") return false;
        // Don't pan when the user is dragging a node
        if (event.type === "mousedown") {
          const target = event.target as SVGElement;
          // If target is inside a .node, let drag handle it
          if (target.closest && target.closest(".node")) return false;
        }
        return true;
      });

    svg.call(zoom);

    // ─── Simulation tick ────────────────────────────────────────────────────

    sim.on("tick", () => {
      linkSel
        .attr("x1", (l) => (l.source as GraphNode).x ?? 0)
        .attr("y1", (l) => (l.source as GraphNode).y ?? 0)
        .attr("x2", (l) => (l.target as GraphNode).x ?? 0)
        .attr("y2", (l) => (l.target as GraphNode).y ?? 0);

      nodeSel.attr(
        "transform",
        (d) => `translate(${d.x ?? 0},${d.y ?? 0})`
      );
    });

    setReady(true);

    return () => {
      sim.stop();
      svg.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, dims.w, dims.h]);

  if (isMobile) {
    return <MobileFallback data={data} />;
  }

  return (
    <div className="relative w-full" style={{ height: "80vh" }}>
      {/* Legend — fixed in SVG-relative bottom-left */}
      <div
        className="absolute bottom-4 left-4 z-10 bg-white border border-neutral-200 rounded p-2 shadow-sm"
        style={{ pointerEvents: "none" }}
      >
        <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
          Legend
        </p>
        {[
          { color: COLOURS.automation.fill, label: "Live automation" },
          { color: COLOURS.queued.fill, label: "Queued / backlog" },
          { color: COLOURS.manual.fill, label: "Not yet automated" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
            <span className="text-[9px] text-neutral-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-20 bg-white border border-neutral-200 rounded shadow-sm p-2 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 220 }}
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
        aria-label="Minimise automation map — force-directed graph"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s" }}
      >
        <g ref={gRef} />
      </svg>
    </div>
  );
}
