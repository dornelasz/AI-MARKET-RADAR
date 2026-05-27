"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { apiPost } from "@/lib/api";
import { Icon } from "./icons";

interface AnalyzeResponse {
  ok?: boolean;
  message?: string;
  error?: string;
}

export function AnalyzeArticleButton({
  articleId,
  label = "Analisar com IA",
}: {
  articleId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    const { data } = await apiPost<AnalyzeResponse>(
      `/api/articles/analyze/${articleId}`,
    );
    if (data.ok) {
      setMessage("Análise concluída.");
      router.refresh();
    } else {
      setMessage(data.message ?? data.error ?? "Não foi possível analisar.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button onClick={run} disabled={loading} className="btn-primary">
        <Icon name="sparkles" className={cn("h-4 w-4", loading && "animate-pulse")} />
        {loading ? "Analisando…" : label}
      </button>
      {message ? <p className="mt-1.5 text-xs text-ink-faint">{message}</p> : null}
    </div>
  );
}
