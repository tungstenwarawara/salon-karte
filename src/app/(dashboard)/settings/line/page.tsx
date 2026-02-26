"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { LineSetupGuide } from "@/components/settings/line-setup-guide";
import { LineStatus } from "@/components/settings/line-status";
import { LineLinkManager } from "@/components/settings/line-link-manager";

type LineConfig = {
  id: string;
  webhook_secret: string;
  is_active: boolean;
  reminder_enabled: boolean;
  confirmation_enabled: boolean;
};

export default function LineSettingsPage() {
  const [config, setConfig] = useState<LineConfig | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { user, salonId } = await getClientAuth();
      if (!user || !salonId) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("salon_line_configs")
        .select("id, webhook_secret, is_active, reminder_enabled, confirmation_enabled")
        .eq("salon_id", salonId)
        .single();

      if (data) setConfig(data);
      setInitialLoading(false);
    };
    load();
  }, []);

  if (initialLoading) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="LINE連携"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "LINE連携" },
        ]}
      />

      {config ? (
        <>
          <LineStatus config={config} onUpdate={setConfig} onDisconnect={() => setConfig(null)} />

          <LineLinkManager />
        </>
      ) : (
        <LineSetupGuide onConnected={setConfig} />
      )}
    </div>
  );
}
