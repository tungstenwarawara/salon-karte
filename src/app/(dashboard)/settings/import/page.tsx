"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ImportStepCard } from "@/components/import/import-step-card";

export default function ImportHubPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ customers: 0, products: 0, records: 0 });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!salon) return;

      const [custRes, prodRes, recRes] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("salon_id", salon.id),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("salon_id", salon.id),
        supabase.from("treatment_records").select("*", { count: "exact", head: true }).eq("salon_id", salon.id),
      ]);

      setCounts({
        customers: custRes.count ?? 0,
        products: prodRes.count ?? 0,
        records: recRes.count ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  // ステップ状態の判定
  const step1Status = counts.customers > 0 ? "done" as const : "available" as const;
  const step2Status = counts.products > 0 ? "done" as const : "skippable" as const;
  const step3Status = counts.customers === 0 && !loading
    ? "locked" as const
    : counts.records > 0
      ? "done" as const
      : "available" as const;

  return (
    <div className="space-y-5">
      <PageHeader
        title="データ取り込み"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データ取り込み" },
        ]}
      />

      {/* ガイド文 */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
        <p className="text-sm">
          Excelの既存データをCSVファイルで一括取り込みできます。
        </p>
        <p className="text-sm text-text-light mt-1">
          上から順番に進めてください。
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border rounded w-1/3" />
                  <div className="h-3 bg-border rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <ImportStepCard
            stepNumber={1}
            title="顧客マスタ"
            description="お客様の基本情報（氏名・連絡先・生年月日など）"
            status={step1Status}
            href="/settings/import-customers"
            count={counts.customers > 0 ? counts.customers : undefined}
          />
          <ImportStepCard
            stepNumber={2}
            title="商品マスタ"
            description="物販商品のマスタデータ（商品名・販売価格・仕入価格）"
            status={step2Status}
            href="/settings/import-products"
            count={counts.products > 0 ? counts.products : undefined}
            skipNote="物販がない場合はスキップできます"
          />
          <ImportStepCard
            stepNumber={3}
            title="施術履歴"
            description="過去の施術記録（日付・お客様名・メニュー・料金・物販）"
            status={step3Status}
            href="/settings/import-records"
            count={counts.records > 0 ? counts.records : undefined}
            lockReason="先に顧客データを取り込んでください"
          />
        </div>
      )}

      {/* 注意事項 */}
      <div className="text-xs text-text-light bg-background rounded-xl p-3 space-y-1">
        <p>💡 ExcelファイルはCSV形式で保存してからアップロードしてください。</p>
        <p>💡 在庫数は取り込まれません。取り込み後に「棚卸し」で現在の在庫数を設定してください。</p>
      </div>
    </div>
  );
}
