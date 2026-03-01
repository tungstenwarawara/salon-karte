"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  customerId: string;
  salonId: string;
  graduatedAt: string | null;
};

export function GraduationToggle({ customerId, salonId, graduatedAt }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const isGraduated = !!graduatedAt;

  const handleGraduate = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({ graduated_at: new Date().toISOString() })
      .eq("id", customerId)
      .eq("salon_id", salonId);

    if (!error) {
      setConfirming(false);
      router.refresh();
    } else {
      console.error("卒業処理エラー:", error);
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({ graduated_at: null })
      .eq("id", customerId)
      .eq("salon_id", salonId);

    if (!error) {
      router.refresh();
    } else {
      console.error("復帰処理エラー:", error);
    }
    setLoading(false);
  };

  if (isGraduated) {
    const date = new Date(graduatedAt);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    return (
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-warning/10 text-warning font-medium px-2 py-0.5 rounded-full">卒業済み</span>
          <span className="text-xs text-text-light">{dateStr}</span>
        </div>
        <button
          onClick={handleRestore}
          disabled={loading}
          className="text-xs text-accent hover:underline min-h-[44px] px-2 disabled:opacity-50"
        >
          {loading ? "処理中..." : "復帰する"}
        </button>
      </div>
    );
  }

  return (
    <>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs text-text-light hover:text-warning transition-colors min-h-[44px] px-2"
        >
          卒業にする
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
          <p className="text-sm font-medium text-red-800">この顧客を卒業にしますか？</p>
          <p className="text-xs text-red-700">顧客一覧でデフォルト非表示になります。あとから復帰もできます。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              onClick={handleGraduate}
              disabled={loading}
              className="flex-1 text-xs bg-warning text-white rounded-xl py-2 min-h-[44px] disabled:opacity-50"
            >
              {loading ? "処理中..." : "卒業にする"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
