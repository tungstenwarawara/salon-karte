"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateShort } from "@/lib/format";

// 前回カルテからコピーする内容
export type PreviousRecordCopy = {
  treatment_area: string;
  products_used: string;
  skin_condition_before: string;
  caution_notes: string;
  menuIds: string[];
};

type PrevRecord = {
  id: string;
  treatment_date: string;
  treatment_area: string | null;
  products_used: string | null;
  skin_condition_before: string | null;
  caution_notes: string | null;
  next_visit_memo: string | null;
};

type Props = {
  salonId: string;
  customerId: string;
  onCopy: (data: PreviousRecordCopy) => void;
};

/**
 * 前回カルテパネル
 * - 前回の「次回への申し送り」を表示（書いたメモが次の業務に還流する）
 * - 「前回の内容をコピー」で施術部位・使用商品・メニュー等をプリフィル（2件目以降の入力を時短）
 */
export function PreviousRecordPanel({ salonId, customerId, onCopy }: Props) {
  const [record, setRecord] = useState<PrevRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setRecord(null);
    setCopied(false);
    if (!salonId || !customerId) return;
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("treatment_records")
        .select("id, treatment_date, treatment_area, products_used, skin_condition_before, caution_notes, next_visit_memo")
        .eq("salon_id", salonId)
        .eq("customer_id", customerId)
        .eq("record_type", "visit")
        .order("treatment_date", { ascending: false })
        .limit(1)
        .maybeSingle<PrevRecord>();
      setRecord(data ?? null);
    };
    load();
  }, [salonId, customerId]);

  if (!record) return null;

  const hasCopyable = !!(record.treatment_area || record.products_used || record.skin_condition_before || record.caution_notes);

  const handleCopy = async () => {
    setCopying(true);
    // 前回のメニューも取得してコピー対象に含める
    const supabase = createClient();
    const { data: menuRows } = await supabase
      .from("treatment_record_menus")
      .select("menu_id")
      .eq("treatment_record_id", record.id)
      .order("sort_order");
    const menuIds = (menuRows ?? []).map((m) => m.menu_id).filter((id): id is string => !!id);
    onCopy({
      treatment_area: record.treatment_area ?? "",
      products_used: record.products_used ?? "",
      skin_condition_before: record.skin_condition_before ?? "",
      caution_notes: record.caution_notes ?? "",
      menuIds,
    });
    setCopying(false);
    setCopied(true);
  };

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-bold text-accent">前回の来店: {formatDateShort(record.treatment_date)}</p>
      {record.next_visit_memo && (
        <div className="bg-surface rounded-lg px-3 py-2">
          <p className="text-xs text-text-light mb-0.5">次回への申し送り</p>
          <p className="text-sm whitespace-pre-wrap">{record.next_visit_memo}</p>
        </div>
      )}
      {hasCopyable && !copied && (
        <button
          type="button"
          onClick={handleCopy}
          disabled={copying}
          className="w-full text-center text-sm text-accent font-medium border border-accent/30 rounded-xl py-2.5 min-h-[44px] hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          {copying ? "コピー中..." : "前回の内容をコピーして入力"}
        </button>
      )}
      {copied && <p className="text-xs text-text-light text-center py-1">前回の内容を入力欄にコピーしました（編集できます）</p>}
    </div>
  );
}
