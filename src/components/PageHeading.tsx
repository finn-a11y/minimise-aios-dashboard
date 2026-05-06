type PageHeadingProps = {
  title: string;
  subtitle?: string;
};

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-3 mb-12">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}
