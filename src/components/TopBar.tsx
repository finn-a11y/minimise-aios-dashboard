import Link from "next/link";
import Image from "next/image";

type TopBarProps = { logoText?: string };

export function TopBar({ logoText }: TopBarProps) {
  return (
    <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
      <Link href="/" className="no-underline flex items-center">
        <Image
          src="/minimise-logo.png"
          alt={logoText ?? "Minimise"}
          width={120}
          height={28}
          priority
          className="h-7 w-auto"
        />
      </Link>
      <nav className="flex gap-6 text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <Link href="/map" className="hover:text-ink transition-colors">
          Map
        </Link>
        <Link href="/tasks" className="hover:text-ink transition-colors">
          Tasks
        </Link>
      </nav>
    </header>
  );
}
