import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  RELEVANCE_LABELS,
  STATUS_LABELS,
  ARTICLE_TYPE_LABELS,
} from "@/lib/format";
import type { ArticleTypeValue, RelevanceLevel } from "@/lib/types";
import { Icon, type IconName } from "./icons";

type Tone = "gray" | "blue" | "green" | "amber" | "red" | "violet";

const TONE_CLASSES: Record<Tone, string> = {
  gray: "bg-bg-overlay text-ink-muted border-line",
  blue: "bg-brand-soft text-brand border-brand-muted/40",
  green: "bg-accent-green/10 text-accent-green border-accent-green/30",
  amber: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  red: "bg-accent-red/10 text-accent-red border-accent-red/30",
  violet: "bg-accent-violet/10 text-accent-violet border-accent-violet/30",
};

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-bg-raised/70 shadow-card backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function relevanceTone(relevance?: string | null): Tone {
  switch (relevance) {
    case "CRITICAL":
      return "red";
    case "HIGH":
      return "amber";
    case "MEDIUM":
      return "blue";
    default:
      return "gray";
  }
}

export function statusTone(status?: string | null): Tone {
  switch (status) {
    case "ANALYZED":
      return "green";
    case "PENDING_ANALYSIS":
      return "amber";
    case "ANALYSIS_FAILED":
      return "red";
    default:
      return "gray";
  }
}

export function RelevanceBadge({ relevance }: { relevance?: string | null }) {
  if (!relevance) return null;
  const label = RELEVANCE_LABELS[relevance as RelevanceLevel] ?? relevance;
  return <Badge tone={relevanceTone(relevance)}>{label}</Badge>;
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const label = STATUS_LABELS[status] ?? status;
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}

export function ArticleTypeBadge({ type }: { type?: string | null }) {
  if (!type || type === "UNKNOWN") return null;
  const label = ARTICLE_TYPE_LABELS[type as ArticleTypeValue] ?? type;
  return <Badge tone="violet">{label}</Badge>;
}

export function ScorePill({ score }: { score: number }) {
  const tone: Tone =
    score >= 75 ? "red" : score >= 50 ? "amber" : score >= 25 ? "blue" : "gray";
  return (
    <Badge tone={tone} className="tabular-nums">
      score {Math.round(score)}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border",
              TONE_CLASSES[tone],
            )}
          >
            <Icon name={icon} className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon = "radar",
  action,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-bg-subtle/40 px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-bg-raised text-ink-muted">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-faint">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
