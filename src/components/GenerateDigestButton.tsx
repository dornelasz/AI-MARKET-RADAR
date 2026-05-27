"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { apiPost } from "@/lib/api";
import { Icon } from "./icons";

export function GenerateDigestButton({
  label = "Gerar digest de hoje",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    const { ok, data } = await apiPost<{ error?: string }>("/api/digest/generate");
    if (ok) {
      router.refresh();
    } else {
      setMessage(data.error ?? "Não foi possível gerar o digest.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button onClick={run} disabled={loading} className="btn-primary">
        <Icon name="sparkles" className={cn("h-4 w-4", loading && "animate-pulse")} />
        {loading ? "Gerando…" : label}
      </button>
      {message ? <p className="mt-1.5 text-xs text-ink-faint">{message}</p> : null}
    </div>
  );
}
