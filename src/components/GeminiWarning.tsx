import Link from "next/link";
import { Icon } from "./icons";

export function GeminiWarning({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-4 py-3 ${className ?? ""}`}
    >
      <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-accent-amber" />
      <div className="text-sm">
        <p className="font-medium text-ink">Gemini não configurado</p>
        {!compact ? (
          <p className="mt-0.5 text-ink-muted">
            A coleta funciona normalmente e os artigos ficam{" "}
            <span className="font-medium text-ink">pendentes de análise</span>. Defina{" "}
            <code className="rounded bg-bg-base/70 px-1 py-0.5 text-xs">
              GEMINI_API_KEY
            </code>{" "}
            para habilitar resumos, classificação e score por IA.{" "}
            <Link href="/settings" className="font-medium text-brand hover:underline">
              Abrir configurações
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
