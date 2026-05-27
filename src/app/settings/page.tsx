import { PageHeader } from "@/components/PageHeader";
import { SettingsPanel } from "@/components/SettingsPanel";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Status do sistema, integração com Gemini e parâmetros de coleta."
      />
      <SettingsPanel />
    </div>
  );
}
