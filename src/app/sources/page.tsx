import { listSources } from "@/lib/db/queries";
import { PageHeader } from "@/components/PageHeader";
import { SourcesManager, type SourceItem } from "@/components/SourcesManager";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await listSources();
  const initial: SourceItem[] = sources.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    type: s.type,
    category: s.category,
    isActive: s.isActive,
    fetchIntervalMinutes: s.fetchIntervalMinutes,
    lastFetchedAt: s.lastFetchedAt ? s.lastFetchedAt.toISOString() : null,
    lastError: s.lastError,
    notes: s.notes,
    _count: s._count,
  }));

  return (
    <div>
      <PageHeader
        title="Fontes"
        description="Gerencie feeds RSS/Atom, releases do GitHub, arXiv e páginas públicas."
      />
      <SourcesManager initialSources={initial} />
    </div>
  );
}
