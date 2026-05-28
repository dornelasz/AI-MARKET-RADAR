"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge, Card } from "./ui";
import { Icon } from "./icons";

interface StatusResponse {
  ai: { configured: boolean; enabled: boolean; hasKey: boolean; model: string };
  fetchIntervalMinutes: number;
  aiBatchSize: number;
  aiAnalysisDailyLimit: number;
  counts: {
    PENDING_ANALYSIS: number;
    ANALYZED: number;
    ANALYSIS_FAILED: number;
    SKIPPED_NO_AI_KEY: number;
    total: number;
  };
  sources: { total: number; active: number };
  lastFetch:
    | { startedAt: string; status: string; source?: { name: string } | null }
    | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export function SettingsPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);

  async function load() {
    const { data } = await apiGet<StatusResponse>("/api/settings/status");
    setStatus(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function testAi() {
    setTesting(true);
    setTestResult(null);
    const { data } = await apiPost<{ ok: boolean; message: string }>(
      "/api/settings/test-ai",
    );
    setTestResult(data);
    setTesting(false);
  }

  async function analyzePending() {
    setAnalyzing(true);
    setAnalyzeResult(null);
    const { data } = await apiPost<{
      attempted: number;
      analyzed: number;
      failed: number;
      message?: string;
    }>("/api/articles/analyze-pending");
    setAnalyzeResult(
      data.message ??
        `${data.analyzed} analisado(s), ${data.failed} falha(s) de ${data.attempted} tentativa(s).`,
    );
    setAnalyzing(false);
    await load();
  }

  if (loading || !status) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">Carregando status do sistema…</p>
      </Card>
    );
  }

  const ai = status.ai;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Status do sistema</h2>
        <div className="mt-3 divide-y divide-line/60">
          <Row
            label="Estado"
            value={<Badge tone="green">Operacional</Badge>}
          />
          <Row label="Total de artigos" value={status.counts.total} />
          <Row label="Pendentes de análise" value={status.counts.PENDING_ANALYSIS} />
          <Row label="Analisados" value={status.counts.ANALYZED} />
          <Row label="Com falha" value={status.counts.ANALYSIS_FAILED} />
          <Row
            label="Fontes ativas"
            value={`${status.sources.active} / ${status.sources.total}`}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Gemini (IA)</h2>
        <div className="mt-3 divide-y divide-line/60">
          <Row
            label="Status"
            value={
              ai.configured ? (
                <Badge tone="green">Configurado</Badge>
              ) : (
                <Badge tone="amber">Não configurado</Badge>
              )
            }
          />
          <Row label="Análise habilitada" value={ai.enabled ? "Sim" : "Não"} />
          <Row label="Chave presente" value={ai.hasKey ? "Sim" : "Não"} />
          <Row label="Modelo" value={<code className="text-xs">{ai.model}</code>} />
        </div>

        {!ai.configured ? (
          <p className="mt-3 rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-2 text-xs text-ink-muted">
            Defina <code>GEMINI_API_KEY</code> no ambiente e mantenha{" "}
            <code>AI_ANALYSIS_ENABLED=true</code>. Sem isso, a coleta continua e os
            artigos ficam pendentes.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={testAi} disabled={testing} className="btn-ghost">
            <Icon name="check" className="h-4 w-4" />
            {testing ? "Testando…" : "Testar Gemini API"}
          </button>
          <button
            onClick={analyzePending}
            disabled={analyzing}
            className="btn-primary"
          >
            <Icon
              name="sparkles"
              className={cn("h-4 w-4", analyzing && "animate-pulse")}
            />
            {analyzing ? "Analisando…" : "Analisar pendentes"}
          </button>
        </div>

        {testResult ? (
          <p
            className={cn(
              "mt-2 text-xs",
              testResult.ok ? "text-accent-green" : "text-accent-red",
            )}
          >
            {testResult.message}
          </p>
        ) : null}
        {analyzeResult ? (
          <p className="mt-2 text-xs text-ink-faint">{analyzeResult}</p>
        ) : null}
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-ink">Coleta</h2>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <div className="divide-y divide-line/60">
            <Row
              label="Intervalo de coleta"
              value={`${status.fetchIntervalMinutes} min`}
            />
            <Row label="Lote de análise (IA)" value={status.aiBatchSize} />
            <Row label="Limite diário de análise" value={status.aiAnalysisDailyLimit} />
          </div>
          <div className="divide-y divide-line/60">
            <Row
              label="Última coleta"
              value={
                status.lastFetch ? timeAgo(status.lastFetch.startedAt) : "nunca"
              }
            />
            <Row
              label="Fonte da última coleta"
              value={status.lastFetch?.source?.name ?? "—"}
            />
            <Row
              label="Resultado"
              value={
                status.lastFetch ? (
                  <Badge
                    tone={status.lastFetch.status === "FAILED" ? "red" : "green"}
                  >
                    {status.lastFetch.status}
                  </Badge>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          O intervalo é definido pela variável <code>FETCH_INTERVAL_MINUTES</code> e
          aplicado pelo worker (<code>npm run worker</code>).
        </p>
      </Card>
    </div>
  );
}
