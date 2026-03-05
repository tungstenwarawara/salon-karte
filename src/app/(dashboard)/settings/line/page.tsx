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

      {/* LINEプラン制限の説明 */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-sm">LINE公式アカウントの通数制限について</h3>
        <p className="text-xs text-text-light leading-relaxed">
          予約確認・リマインドなどのメッセージは、LINE公式アカウントの無料通数（月200通）を消費します。
          1日あたり平均5〜10件の予約通知であれば無料枠内で運用できます。
        </p>
        <p className="text-xs text-text-light leading-relaxed">
          月200通を超える場合は、LINE公式アカウントの有料プラン（ライトプラン: 月5,000通 / 5,000円）へのアップグレードをご検討ください。
        </p>
        <a
          href="https://www.lycbiz.com/jp/service/line-official-account/plan/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-accent hover:underline"
        >
          LINE公式アカウントの料金プランを確認する &rarr;
        </a>
      </div>
    </div>
  );
}
