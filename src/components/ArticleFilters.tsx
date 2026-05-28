"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "./icons";

export interface FilterSource {
  id: string;
  name: string;
}

export function ArticleFilters({ sources }: { sources: FilterSource[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [relevance, setRelevance] = useState(searchParams.get("relevance") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const hasFilters = Boolean(q || category || relevance || source || from || to);

  function apply(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category.trim()) params.set("category", category.trim());
    if (relevance) params.set("relevance", relevance);
    if (source) params.set("source", source);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clear() {
    setQ("");
    setCategory("");
    setRelevance("");
    setSource("");
    setFrom("");
    setTo("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={apply}
      className="rounded-2xl border border-line bg-bg-raised/70 p-4 shadow-card"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <label className="label">Busca por texto</label>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou conteúdo…"
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label">Relevância</label>
          <select
            value={relevance}
            onChange={(e) => setRelevance(e.target.value)}
            className="input"
          >
            <option value="">Todas</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>

        <div>
          <label className="label">Fonte</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="input"
          >
            <option value="">Todas</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Categoria</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ex.: LLM, funding…"
            className="input"
          />
        </div>

        <div>
          <label className="label">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="submit" className="btn-primary">
          <Icon name="search" className="h-4 w-4" />
          Filtrar
        </button>
        {hasFilters ? (
          <button type="button" onClick={clear} className="btn-ghost">
            Limpar filtros
          </button>
        ) : null}
      </div>
    </form>
  );
}
