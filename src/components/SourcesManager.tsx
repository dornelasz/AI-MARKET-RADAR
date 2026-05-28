"use client";

import { useState, type FormEvent } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { SOURCE_TYPE_LABELS, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge, Card, EmptyState } from "./ui";
import { Icon } from "./icons";

export interface SourceItem {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string | null;
  isActive: boolean;
  fetchIntervalMinutes: number;
  lastFetchedAt: string | null;
  lastError: string | null;
  notes: string | null;
  _count?: { articles: number };
}

const SOURCE_TYPES = [
  "RSS",
  "ATOM",
  "BLOG",
  "GITHUB_RELEASES",
  "ARXIV",
  "WEBPAGE",
  "OTHER",
];

interface FormState {
  name: string;
  url: string;
  type: string;
  category: string;
  fetchIntervalMinutes: number;
  notes: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  url: "",
  type: "RSS",
  category: "",
  fetchIntervalMinutes: 15,
  notes: "",
  isActive: true,
};

export function SourcesManager({
  initialSources,
}: {
  initialSources: SourceItem[];
}) {
  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function refresh() {
    const { data } = await apiGet<SourceItem[]>("/api/sources");
    if (Array.isArray(data)) setSources(data);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name,
      url: form.url,
      type: form.type,
      category: form.category || null,
      fetchIntervalMinutes: Number(form.fetchIntervalMinutes) || 15,
      notes: form.notes || null,
      isActive: form.isActive,
    };
    const res = editingId
      ? await apiPatch(`/api/sources/${editingId}`, payload)
      : await apiPost("/api/sources", payload);

    if (res.ok) {
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await refresh();
    } else {
      setError(
        (res.data as { error?: string })?.error ??
          "Não foi possível salvar a fonte.",
      );
    }
    setBusy(false);
  }

  function startEdit(source: SourceItem) {
    setEditingId(source.id);
    setError(null);
    setForm({
      name: source.name,
      url: source.url,
      type: source.type,
      category: source.category ?? "",
      fetchIntervalMinutes: source.fetchIntervalMinutes,
      notes: source.notes ?? "",
      isActive: source.isActive,
    });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  async function toggle(source: SourceItem) {
    await apiPatch(`/api/sources/${source.id}`, { isActive: !source.isActive });
    await refresh();
  }

  async function remove(source: SourceItem) {
    if (
      !window.confirm(
        `Remover a fonte "${source.name}"? Os artigos coletados dela também serão removidos.`,
      )
    )
      return;
    await apiDelete(`/api/sources/${source.id}`);
    await refresh();
  }

  async function fetchNow(source: SourceItem) {
    setFetchingId(source.id);
    await apiPost(`/api/sources/${source.id}/fetch`);
    setFetchingId(null);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-ink">
          {editingId ? "Editar fonte" : "Cadastrar nova fonte"}
        </h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ex.: Hugging Face Transformers"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">URL do feed / página</label>
            <input
              required
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://github.com/owner/repo/releases.atom"
              className="input"
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="input"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SOURCE_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Categoria</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="ex.: open-source, papers…"
              className="input"
            />
          </div>
          <div>
            <label className="label">Intervalo de coleta (min)</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={form.fetchIntervalMinutes}
              onChange={(e) =>
                set("fetchIntervalMinutes", Number(e.target.value))
              }
              className="input"
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-line bg-bg-base accent-brand"
              />
              Fonte ativa
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notas</label>
            <input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="ex.: feed confirmado em 2026-05"
              className="input"
            />
          </div>

          {error ? (
            <p className="sm:col-span-2 text-sm text-accent-red">{error}</p>
          ) : null}

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">
              <Icon name={editingId ? "check" : "plus"} className="h-4 w-4" />
              {busy ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar fonte"}
            </button>
            {editingId ? (
              <button type="button" onClick={cancelEdit} className="btn-ghost">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      {sources.length === 0 ? (
        <EmptyState
          icon="sources"
          title="Nenhuma fonte cadastrada"
          description="Adicione feeds RSS/Atom, releases do GitHub ou páginas públicas para começar a coletar."
        />
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <Card key={source.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="blue">{SOURCE_TYPE_LABELS[source.type] ?? source.type}</Badge>
                    <Badge tone={source.isActive ? "green" : "gray"}>
                      {source.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    {source.category ? <Badge tone="gray">{source.category}</Badge> : null}
                  </div>
                  <p className="truncate text-sm font-semibold text-ink">
                    {source.name}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate text-xs text-ink-faint hover:text-brand"
                  >
                    {source.url}
                  </a>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                    <span>{source._count?.articles ?? 0} artigo(s)</span>
                    <span>intervalo {source.fetchIntervalMinutes} min</span>
                    <span>
                      última coleta:{" "}
                      {source.lastFetchedAt ? timeAgo(source.lastFetchedAt) : "nunca"}
                    </span>
                  </div>
                  {source.notes ? (
                    <p className="mt-1 text-xs text-ink-faint">Nota: {source.notes}</p>
                  ) : null}
                  {source.lastError ? (
                    <p className="mt-1.5 rounded-md border border-accent-red/30 bg-accent-red/10 px-2 py-1 text-xs text-accent-red">
                      Último erro: {source.lastError}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button
                    onClick={() => fetchNow(source)}
                    disabled={fetchingId === source.id}
                    className="btn-ghost px-2.5 py-1.5 text-xs"
                    title="Coletar desta fonte agora"
                  >
                    <Icon
                      name="refresh"
                      className={cn(
                        "h-3.5 w-3.5",
                        fetchingId === source.id && "animate-spin",
                      )}
                    />
                    Coletar
                  </button>
                  <button
                    onClick={() => toggle(source)}
                    className="btn-ghost px-2.5 py-1.5 text-xs"
                  >
                    {source.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => startEdit(source)}
                    className="btn-ghost px-2.5 py-1.5 text-xs"
                  >
                    <Icon name="edit" className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => remove(source)}
                    className="btn-danger px-2.5 py-1.5 text-xs"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
