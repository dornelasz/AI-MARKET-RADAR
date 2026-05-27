"use client";

import { useState, type FormEvent } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { RELEVANCE_LABELS } from "@/lib/format";
import { Badge, Card, EmptyState } from "./ui";
import { Icon } from "./icons";

export interface AlertItem {
  id: string;
  name: string;
  keyword: string | null;
  company: string | null;
  category: string | null;
  minRelevance: string | null;
  isActive: boolean;
}

interface FormState {
  name: string;
  keyword: string;
  company: string;
  category: string;
  minRelevance: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  keyword: "",
  company: "",
  category: "",
  minRelevance: "",
  isActive: true,
};

export function AlertsManager({
  initialAlerts,
}: {
  initialAlerts: AlertItem[];
}) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function refresh() {
    const { data } = await apiGet<AlertItem[]>("/api/alerts");
    if (Array.isArray(data)) setAlerts(data);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.keyword && !form.company && !form.category && !form.minRelevance) {
      setError(
        "Defina ao menos um critério: palavra-chave, empresa, categoria ou relevância mínima.",
      );
      return;
    }

    setBusy(true);
    const res = await apiPost("/api/alerts", {
      name: form.name,
      keyword: form.keyword || null,
      company: form.company || null,
      category: form.category || null,
      minRelevance: form.minRelevance || null,
      isActive: form.isActive,
    });
    if (res.ok) {
      setForm({ ...EMPTY_FORM });
      await refresh();
    } else {
      setError(
        (res.data as { error?: string })?.error ??
          "Não foi possível criar o alerta.",
      );
    }
    setBusy(false);
  }

  async function toggle(alert: AlertItem) {
    await apiPatch(`/api/alerts/${alert.id}`, { isActive: !alert.isActive });
    await refresh();
  }

  async function remove(alert: AlertItem) {
    if (!window.confirm(`Remover o alerta "${alert.name}"?`)) return;
    await apiDelete(`/api/alerts/${alert.id}`);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-ink">Criar alerta</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Alertas são internos nesta versão e aparecem apenas neste painel (sem e-mail
          ainda).
        </p>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome do alerta</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ex.: Lançamentos de modelos abertos"
              className="input"
            />
          </div>
          <div>
            <label className="label">Palavra-chave</label>
            <input
              value={form.keyword}
              onChange={(e) => set("keyword", e.target.value)}
              placeholder="ex.: open source"
              className="input"
            />
          </div>
          <div>
            <label className="label">Empresa</label>
            <input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="ex.: OpenAI"
              className="input"
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="ex.: funding"
              className="input"
            />
          </div>
          <div>
            <label className="label">Relevância mínima</label>
            <select
              value={form.minRelevance}
              onChange={(e) => set("minRelevance", e.target.value)}
              className="input"
            >
              <option value="">Qualquer</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>

          {error ? (
            <p className="sm:col-span-2 text-sm text-accent-red">{error}</p>
          ) : null}

          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              {busy ? "Salvando…" : "Criar alerta"}
            </button>
          </div>
        </form>
      </Card>

      {alerts.length === 0 ? (
        <EmptyState
          icon="alerts"
          title="Nenhum alerta criado"
          description="Crie alertas por palavra-chave, empresa, categoria ou relevância mínima para destacar o que importa."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={alert.isActive ? "green" : "gray"}>
                    {alert.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-ink">{alert.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {alert.keyword ? (
                    <Badge tone="blue">palavra: {alert.keyword}</Badge>
                  ) : null}
                  {alert.company ? (
                    <Badge tone="violet">empresa: {alert.company}</Badge>
                  ) : null}
                  {alert.category ? (
                    <Badge tone="gray">categoria: {alert.category}</Badge>
                  ) : null}
                  {alert.minRelevance ? (
                    <Badge tone="amber">
                      relevância ≥{" "}
                      {RELEVANCE_LABELS[
                        alert.minRelevance as keyof typeof RELEVANCE_LABELS
                      ] ?? alert.minRelevance}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => toggle(alert)}
                  className="btn-ghost px-2.5 py-1.5 text-xs"
                >
                  {alert.isActive ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => remove(alert)}
                  className="btn-danger px-2.5 py-1.5 text-xs"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
