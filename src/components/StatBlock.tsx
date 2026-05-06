type StatBlockProps = {
  value: number | string;
  label: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export function StatBlock({ value, label, size = "md" }: StatBlockProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`${sizeClasses[size]} font-bold tracking-tight text-ink`}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-widest text-ink-muted">
        {label}
      </span>
    </div>
  );
}
