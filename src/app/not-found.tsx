import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-6 md:px-12 py-32 flex flex-col gap-6">
      <h1 className="text-5xl font-bold tracking-tight text-ink">
        Page not found.
      </h1>
      <Link
        href="/"
        className="text-accent font-semibold hover:underline w-fit"
      >
        Back home →
      </Link>
    </div>
  );
}
