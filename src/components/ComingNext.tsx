import type { ComingNextItem as ComingNextItemType } from "@/types/dashboard";
import { ComingNextItem } from "./ComingNextItem";

type ComingNextProps = { items: ComingNextItemType[] };

export function ComingNext({ items }: ComingNextProps) {
  return (
    <section className="px-6 md:px-12 mb-24">
      <h2 className="text-3xl font-bold tracking-tight text-ink mb-8">
        What&apos;s queued
      </h2>
      {items.length === 0 ? (
        <p className="text-ink-muted">Nothing queued.</p>
      ) : (
        <ul className="border-t border-line">
          {items.map((item, i) => (
            <ComingNextItem
              key={`${item.department}-${i}`}
              name={item.name}
              department={item.department}
              leverage={item.leverage}
              status={item.status}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
