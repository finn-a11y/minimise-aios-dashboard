import Link from "next/link";

type TopBarProps = { logoText: string };

export function TopBar({ logoText }: TopBarProps) {
  return (
    <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-ink no-underline"
      >
        {logoText}
      </Link>
      <nav className="flex gap-6 text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <Link href="/tasks" className="hover:text-ink transition-colors">
          Tasks
        </Link>
      </nav>
    </header>
  );
}
