type HeroProps = {
  hoursSavedPerWeek: number;
  automationsLive: number;
  tasksAutomated: number;
  tagline: string;
};

export function Hero({
  hoursSavedPerWeek,
  automationsLive,
  tasksAutomated,
  tagline,
}: HeroProps) {
  return (
    <section className="px-6 md:px-12 pt-12 pb-20 md:pt-20 md:pb-32">
      <p className="text-xs uppercase tracking-widest text-ink-muted mb-8">
        {tagline}
      </p>
      <h1 className="font-bold text-ink text-hero">
        {hoursSavedPerWeek}
        <span className="text-3xl md:text-5xl text-ink-muted ml-4 align-baseline font-medium tracking-tight">
          hrs saved / week
        </span>
      </h1>
      <p className="mt-8 text-xl md:text-2xl text-ink-muted">
        <span className="text-ink font-semibold">{automationsLive}</span>{" "}
        automations live
        <span className="mx-3 text-ink-muted">·</span>
        <span className="text-ink font-semibold">{tasksAutomated}</span> tasks
        automated
      </p>
    </section>
  );
}
