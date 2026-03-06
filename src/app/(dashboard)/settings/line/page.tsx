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

      {/* よくある質問 */}
      <details className="bg-surface border border-border rounded-xl">
        <summary className="font-bold text-sm p-4 cursor-pointer min-h-[44px] flex items-center">
          よくある質問・トラブル対応
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">LINEの通知が届きません</p>
            <p className="text-xs text-text-light leading-relaxed">
              ① 上の「LINE連携を有効にする」がONになっているか確認してください。
              ② 受信用アドレス（Webhook URL）がLINE側に正しく登録されているか確認してください。
              ③ LINE側で「Webhookの利用」がONになっているか確認してください。
              ④ お客様がLINE友だちと紐付けされているか、顧客詳細ページで確認してください。
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">顧客とLINE友だちの紐付け方がわかりません</p>
            <p className="text-xs text-text-light leading-relaxed">
              2つの方法があります。①このページ下部の「LINE友だち管理」から紐付ける方法。②各顧客の詳細ページにある「LINE連携」セクションから紐付ける方法。
              まず「友だちを同期」ボタンを押して、LINE公式アカウントの友だちを取り込んでください。
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">「接続番号」「秘密キー」「送信キー」はどこにありますか？</p>
            <p className="text-xs text-text-light leading-relaxed">
              <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                LINE Developers
              </a>
              にログインし、お使いのアカウントを選択してください。
              「チャネル基本設定」タブに接続番号と秘密キー、「Messaging API設定」タブに送信キー（アクセストークン）があります。
            </p>
          </div>
        </div>
      </details>

      {/* LINEプラン制限の説明 */}
      <details className="bg-surface border border-border rounded-xl">
        <summary className="font-bold text-sm p-4 cursor-pointer min-h-[44px] flex items-center">
          LINE公式アカウントの通数制限について
        </summary>
        <div className="px-4 pb-4 space-y-2">
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
      </details>
    </div>
  );
}
