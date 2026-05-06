type HeroProps = {
  hoursSavedPerWeek: number;
  automationsLive: number;
  tasksAutomated: number;
  tasksTotal: number;
  tagline: string;
};

export function Hero({
  hoursSavedPerWeek,
  automationsLive,
  tasksAutomated,
  tasksTotal,
  tagline,
}: HeroProps) {
  const pct = tasksTotal > 0 ? Math.round((tasksAutomated / tasksTotal) * 100) : 0;
  const fillPct = tasksTotal > 0 ? (tasksAutomated / tasksTotal) * 100 : 0;

  return (
    <section className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-6 md:px-12 py-12">
      <div className="flex flex-col items-center text-center w-full">
        <p className="text-xs uppercase tracking-widest text-ink-muted mb-8">
          {tagline}
        </p>
        <h1 className="font-bold text-ink text-hero leading-none">
          {hoursSavedPerWeek}
          <span className="text-3xl md:text-5xl text-ink-muted ml-4 align-baseline font-medium tracking-tight">
            hrs saved / week
          </span>
        </h1>
        <p className="mt-8 text-xl md:text-2xl text-ink-muted">
          <span className="text-ink font-semibold">{tasksAutomated}</span>
          {" / "}
          <span className="text-ink font-semibold">{tasksTotal}</span> tasks automated
        </p>

        {/* Progress bar */}
        <div className="relative mt-6 w-full max-w-md h-10 bg-neutral-200 rounded-sm overflow-hidden">
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-emerald-200"
            style={{ width: `${fillPct}%` }}
          />
          {/* Percentage label — always centred inside the bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-ink z-10">
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
