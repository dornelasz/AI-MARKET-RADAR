import { listAlerts } from "@/lib/db/queries";
import { PageHeader } from "@/components/PageHeader";
import { AlertsManager, type AlertItem } from "@/components/AlertsManager";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await listAlerts();
  const initial: AlertItem[] = alerts.map((a) => ({
    id: a.id,
    name: a.name,
    keyword: a.keyword,
    company: a.company,
    category: a.category,
    minRelevance: a.minRelevance,
    isActive: a.isActive,
  }));

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Defina alertas internos por palavra-chave, empresa, categoria ou relevância mínima."
      />
      <AlertsManager initialAlerts={initial} />
    </div>
  );
}
