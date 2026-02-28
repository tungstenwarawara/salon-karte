"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SettingsLinkCard } from "@/components/settings/settings-link-card";
import { SubmitButton } from "@/components/ui/submit-button";

export default function SettingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<{ name: string; phone: string; address: string }>({ name: "", phone: "", address: "" });
  const [salonId, setSalonId] = useState("");
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);

      const supabase = createClient();
      const [salonRes, staffRes] = await Promise.all([
        supabase.from("salons").select("id, name, phone, address").eq("id", sid).single(),
        supabase.from("staff").select("id", { count: "exact", head: true }).eq("salon_id", sid).eq("is_active", true),
      ]);

      if (salonRes.data) {
        setSalon({ name: salonRes.data.name, phone: salonRes.data.phone ?? "", address: salonRes.data.address ?? "" });
      }
      setStaffCount(staffRes.count ?? 0);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!salonId) { setError("認証エラー"); setLoading(false); return; }

    const supabase = createClient();
    const { error } = await supabase.from("salons").update({ name: salon.name, phone: salon.phone || null, address: salon.address || null }).eq("id", salonId);

    if (error) {
      console.error("サロン情報保存エラー:", error);
      setError(`保存に失敗しました: ${error.message}`);
    } else {
      showToast("サロン情報を保存しました");
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <h2 className="text-xl font-bold">設定</h2>

      {/* サロン情報 */}
      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">サロン情報</h3>
        {error && <ErrorAlert message={error} />}
        <div>
          <label className="block text-sm font-medium mb-1.5">サロン名 <span className="text-error">*</span></label>
          <input type="text" value={salon.name} onChange={(e) => setSalon({ ...salon, name: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">電話番号</label>
          <input type="tel" value={salon.phone} onChange={(e) => setSalon({ ...salon, phone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">住所</label>
          <input type="text" value={salon.address} onChange={(e) => setSalon({ ...salon, address: e.target.value })} className={inputClass} />
        </div>
        <SubmitButton loading={loading} className="w-full" />
      </form>

      {/* 設定リンク */}
      <SettingsLinkCard href="/settings/staff" title="スタッフ管理" description="スタッフの追加・権限設定・招待" />
      {staffCount > 1 && (
        <SettingsLinkCard href="/settings/shifts" title="シフト管理" description="スタッフの勤務スケジュール・休日設定" />
      )}
      <SettingsLinkCard href="/settings/business-hours" title="営業時間設定" description="曜日ごとの営業時間・休業日の設定" />
      <SettingsLinkCard href="/settings/booking-rules" title="予約受付設定" description="当日予約の可否・予約締切時間の設定" />
      <SettingsLinkCard href="/settings/holidays" title="不定休設定" description="臨時休業日の設定" />
      <SettingsLinkCard href="/settings/menus" title="施術メニュー管理" description="施術メニューの追加・編集" />
      <SettingsLinkCard href="/settings/counseling-template" title="カウンセリングシート設定" description="質問項目・注意事項・同意書のカスタマイズ" />
      <SettingsLinkCard href="/settings/line" title="LINE連携" description="LINE公式アカウントと連携して予約通知を自動送信" />
      <SettingsLinkCard href="/settings/import" title="データ取り込み" description="顧客・商品・施術履歴をCSVで一括登録" />
      <SettingsLinkCard href="/settings/export" title="データエクスポート" description="顧客・施術・物販・予約・回数券をCSVでダウンロード" />
      <SettingsLinkCard href="/guide" title="使い方ガイド" description="基本的な操作方法・よくある質問" />

      {/* ログアウト */}
      <div className="pt-2">
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          }}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 py-3 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          ログアウト
        </button>
      </div>
    </div>
  );
}
