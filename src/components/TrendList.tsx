import { cn } from "@/lib/cn";

export interface TrendItem {
  term: string;
  count: number;
}

export function TrendList({
  items,
  emptyLabel = "Sem dados ainda.",
  accent = "brand",
}: {
  items: TrendItem[];
  emptyLabel?: string;
  accent?: "brand" | "violet" | "green";
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.count), 1);
  const barColor =
    accent === "violet"
      ? "bg-accent-violet/30"
      : accent === "green"
        ? "bg-accent-green/25"
        : "bg-brand/25";

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item.term}-${index}`} className="relative">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-md", barColor)}
            style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between gap-2 px-2.5 py-1.5">
            <span className="truncate text-sm text-ink">
              <span className="mr-2 text-xs text-ink-faint tabular-nums">
                {index + 1}
              </span>
              {item.term}
            </span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-ink-muted">
              {item.count}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
