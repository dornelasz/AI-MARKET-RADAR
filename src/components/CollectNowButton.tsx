"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { apiPost } from "@/lib/api";
import { Icon } from "./icons";

interface FetchRunResponse {
  totals?: { found: number; created: number; duplicates: number; failedSources: number };
  error?: string;
}

export function CollectNowButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const { ok, data } = await apiPost<FetchRunResponse>("/api/fetch/run");
      if (!ok || !data.totals) {
        throw new Error(data.error ?? "Falha na coleta.");
      }
      const t = data.totals;
      setMessage(
        `${t.created} novo(s), ${t.duplicates} duplicado(s)` +
          (t.failedSources ? `, ${t.failedSources} fonte(s) com erro` : "") +
          ".",
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button onClick={run} disabled={loading} className="btn-primary">
        <Icon name="refresh" className={cn("h-4 w-4", loading && "animate-spin")} />
        {loading ? "Coletando…" : "Coletar agora"}
      </button>
      {message ? <p className="mt-1.5 text-xs text-ink-faint">{message}</p> : null}
    </div>
  );
}
