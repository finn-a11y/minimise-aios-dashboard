type ComingNextItemProps = {
  name: string;
  department: string;
  leverage: "S" | "M" | "L";
  status: "backlog" | "spec'd" | "building";
};

const leverageLabel: Record<"S" | "M" | "L", string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};

export function ComingNextItem({
  name,
  department,
  leverage,
  status,
}: ComingNextItemProps) {
  return (
    <li className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-b-0">
      <div className="flex items-center gap-4 flex-wrap min-w-0">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted bg-surface-muted px-2 py-1 rounded-full">
          {department}
        </span>
        <span className="font-semibold text-ink truncate">{name}</span>
        <span className="text-xs text-ink-muted">
          {leverageLabel[leverage]} leverage
        </span>
      </div>
      <span className="text-xs uppercase tracking-widest text-ink-muted shrink-0">
        {status}
      </span>
    </li>
  );
}
