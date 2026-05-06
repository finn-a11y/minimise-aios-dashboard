"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { DashboardData, Automation, Department } from "@/types/dashboard";

// ─── constants ────────────────────────────────────────────────────────────────

const CX = 450;
const CY = 450;
const R1 = 190; // centre → dept
const R2 = 360; // centre → automation
const AUTO_R = 10; // automation node circle radius
const ARC_DEG = 52; // arc width (degrees) per dept's automation cluster
const VIEWBOX_W = 900;
const VIEWBOX_H = 900;

// ─── colour helpers ────────────────────────────────────────────────────────────

function autoFill(automation: Automation): string {
  // mode field may not exist yet in current schema — guard with optional
  const mode = (automation as Automation & { mode?: string }).mode;
  if (automation.status === "live") {
    if (mode === "scheduled") return "#fbbf24"; // amber-400
    return "#10b981"; // emerald-500
  }
  if (automation.status === "building") return "#fbbf24"; // amber-400
  return "#d1d5db"; // neutral-300
}

function autoStroke(automation: Automation): string {
  const mode = (automation as Automation & { mode?: string }).mode;
  if (automation.status === "live") {
    if (mode === "scheduled") return "#d97706";
    return "#047857";
  }
  if (automation.status === "building") return "#d97706";
  return "#9ca3af";
}

function tooltipText(automation: Automation, deptName: string): string {
  const mode = (automation as Automation & { mode?: string }).mode;
  const parts = [
    automation.name,
    `${automation.status}${mode ? ` · ${mode}` : ""}`,
    automation.skill,
    deptName,
  ];
  return parts.filter(Boolean).join(" · ");
}

// ─── geometry helpers ──────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// angles for the 6 dept nodes, starting from top (-90°), going clockwise
function deptAngles(count: number): number[] {
  return Array.from({ length: count }, (_, i) => -90 + i * (360 / count));
}

// positions for automations fanned across an arc centred on deptAngle
function autoPositions(
  deptAngle: number,
  count: number
): Array<{ x: number; y: number; labelAngle: number }> {
  if (count === 0) return [];
  if (count === 1) {
    const p = polar(CX, CY, R2, deptAngle);
    return [{ ...p, labelAngle: deptAngle }];
  }
  const halfArc = ARC_DEG / 2;
  const step = ARC_DEG / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const angle = deptAngle - halfArc + i * step;
    const p = polar(CX, CY, R2, angle);
    return { ...p, labelAngle: angle };
  });
}

// label anchor + offset based on which quadrant the node sits in
type TextAnchor = "middle" | "start" | "end";

function labelAnchorAndOffset(angleDeg: number): {
  anchor: TextAnchor;
  dx: number;
  dy: number;
} {
  const norm = ((angleDeg % 360) + 360) % 360;
  // right half → left-anchor to the right; left half → right-anchor to the left
  if (norm < 20 || norm > 340) {
    return { anchor: "middle" as TextAnchor, dx: 0, dy: -16 };
  }
  if (norm >= 20 && norm <= 160) {
    return { anchor: "start" as TextAnchor, dx: 16, dy: 4 };
  }
  if (norm > 160 && norm < 200) {
    return { anchor: "middle" as TextAnchor, dx: 0, dy: 22 };
  }
  return { anchor: "end" as TextAnchor, dx: -16, dy: 4 };
}

// ─── SVG sub-components ───────────────────────────────────────────────────────

function CentreNode({ name }: { name: string }) {
  const w = 120;
  const h = 56;
  const pad = 8;
  const logoH = 22;
  return (
    <g>
      <rect
        x={CX - w / 2}
        y={CY - h / 2}
        width={w}
        height={h}
        rx={4}
        fill="white"
        stroke="#e5e7eb"
        strokeWidth={1.5}
      />
      {/* Logo rendered via foreignObject for Next/Image */}
      <foreignObject
        x={CX - w / 2 + pad}
        y={CY - h / 2 + pad}
        width={w - pad * 2}
        height={logoH}
      >
        <div
          // @ts-expect-error -- xmlns required for SVG foreignObject
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ display: "flex", alignItems: "center", height: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/minimise-logo.png"
            alt={name}
            style={{ height: `${logoH}px`, width: "auto", objectFit: "contain" }}
          />
        </div>
      </foreignObject>
      <text
        x={CX}
        y={CY + h / 2 - pad - 2}
        textAnchor="middle"
        fontSize={9}
        fill="#7d7d7d"
        fontFamily="var(--font-sans, ui-sans-serif)"
        fontWeight={500}
        letterSpacing="0.06em"
        style={{ textTransform: "uppercase" }}
      >
        {name}
      </text>
    </g>
  );
}

function DeptNode({
  x,
  y,
  name,
  live,
  total,
}: {
  x: number;
  y: number;
  name: string;
  live: number;
  total: number;
}) {
  const w = 88;
  const h = 36;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={3}
        fill="white"
        stroke="#e5e7eb"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="#1c1c1e"
        fontFamily="var(--font-sans, ui-sans-serif)"
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 10}
        textAnchor="middle"
        fontSize={9}
        fill="#7d7d7d"
        fontFamily="var(--font-sans, ui-sans-serif)"
      >
        {live} live · {total} tasks
      </text>
    </g>
  );
}

function AutoNode({
  x,
  y,
  labelAngle,
  automation,
  deptName,
}: {
  x: number;
  y: number;
  labelAngle: number;
  automation: Automation;
  deptName: string;
}) {
  const fill = autoFill(automation);
  const stroke = autoStroke(automation);
  const { anchor, dx, dy } = labelAnchorAndOffset(labelAngle);

  // Truncate long names
  const label =
    automation.name.length > 22
      ? automation.name.slice(0, 20) + "…"
      : automation.name;

  return (
    <g className="group cursor-default">
      <title>{tooltipText(automation, deptName)}</title>
      <circle
        cx={x}
        cy={y}
        r={AUTO_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        className="transition-transform duration-150 group-hover:scale-125"
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <text
        x={x + dx}
        y={y + dy}
        textAnchor={anchor}
        fontSize={8.5}
        fill="#374151"
        fontFamily="var(--font-sans, ui-sans-serif)"
        pointerEvents="none"
      >
        {label}
      </text>
    </g>
  );
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
              {dept.automations.map((auto) => {
                const fill = autoFill(auto);
                return (
                  <li key={auto.skill} className="flex items-center gap-2 text-xs text-ink">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fill }}
                    />
                    {auto.name}
                    <span className="text-ink-muted ml-auto">{auto.status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MindMap({ data }: { data: DashboardData }) {
  // Initialise from matchMedia so there's no flash on first paint (SSR yields false,
  // client hydrates to the real value immediately via the lazy initialiser).
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Set once on mount via the listener pattern to satisfy the lint rule
    if (mq.matches !== isMobile) {
      handler({ matches: mq.matches } as MediaQueryListEvent);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return <MobileFallback data={data} />;
  }

  const depts = data.departments;
  const angles = deptAngles(depts.length);

  // Collect all edges + nodes in one pass
  const deptPositions = depts.map((dept: Department, i: number) => ({
    dept,
    angle: angles[i],
    pos: polar(CX, CY, R1, angles[i]),
  }));

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      className="w-full h-auto"
      style={{ maxHeight: "80vh" }}
      aria-label="Minimise automation mind map"
    >
      {/* ── Edges: centre → dept ── */}
      {deptPositions.map(({ dept, pos }) => (
        <line
          key={`edge-centre-${dept.slug}`}
          x1={CX}
          y1={CY}
          x2={pos.x}
          y2={pos.y}
          stroke="#d1d5db"
          strokeWidth={1}
        />
      ))}

      {/* ── Edges: dept → automations ── */}
      {deptPositions.map(({ dept, angle, pos }) => {
        const autoPos = autoPositions(angle, dept.automations.length);
        return dept.automations.map((auto: Automation, j: number) => (
          <line
            key={`edge-dept-${dept.slug}-${j}`}
            x1={pos.x}
            y1={pos.y}
            x2={autoPos[j].x}
            y2={autoPos[j].y}
            stroke="#d1d5db"
            strokeWidth={0.75}
          />
        ));
      })}

      {/* ── Centre node ── */}
      <CentreNode name={data.instance.name} />

      {/* ── Dept nodes + automation nodes ── */}
      {deptPositions.map(({ dept, angle, pos }) => {
        const autoPos = autoPositions(angle, dept.automations.length);
        return (
          <g key={dept.slug}>
            <DeptNode
              x={pos.x}
              y={pos.y}
              name={dept.name}
              live={dept.automations_live}
              total={dept.tasks_total}
            />
            {dept.automations.map((auto: Automation, j: number) => (
              <AutoNode
                key={auto.skill}
                x={autoPos[j].x}
                y={autoPos[j].y}
                labelAngle={autoPos[j].labelAngle}
                automation={auto}
                deptName={dept.name}
              />
            ))}
          </g>
        );
      })}

      {/* ── Legend ── */}
      <g transform={`translate(20, ${VIEWBOX_H - 70})`}>
        <text fontSize={8} fill="#9ca3af" fontFamily="var(--font-sans, ui-sans-serif)" letterSpacing="0.05em" fontWeight={500} style={{ textTransform: "uppercase" }}>Legend</text>
        {[
          { fill: "#10b981", stroke: "#047857", label: "Live (event)" },
          { fill: "#fbbf24", stroke: "#d97706", label: "Live (scheduled) / building" },
          { fill: "#d1d5db", stroke: "#9ca3af", label: "Queued / todo" },
        ].map(({ fill, stroke, label }, i) => (
          <g key={label} transform={`translate(0, ${14 + i * 14})`}>
            <circle cx={6} cy={0} r={5} fill={fill} stroke={stroke} strokeWidth={1} />
            <text x={16} y={4} fontSize={9} fill="#6b7280" fontFamily="var(--font-sans, ui-sans-serif)">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
