"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Toast, useToast } from "@/components/ui/toast";
import { LineLinkCard } from "@/components/settings/line-link-card";
import { useLineLinkActions } from "@/hooks/use-line-link-actions";

type LineLink = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  is_following: boolean;
  customer_id: string | null;
  linked_at: string | null;
};

type Customer = {
  id: string;
  last_name: string;
  first_name: string;
};

export function LineLinkManager() {
  const [links, setLinks] = useState<LineLink[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const actions = useLineLinkActions();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
    if (!salon) return;

    const [linksRes, cusRes] = await Promise.all([
      supabase.from("customer_line_links")
        .select("id, line_user_id, display_name, picture_url, is_following, customer_id, linked_at")
        .eq("salon_id", salon.id).order("created_at", { ascending: false }),
      supabase.from("customers").select("id, last_name, first_name")
        .eq("salon_id", salon.id).order("last_name", { ascending: true }),
    ]);
    setLinks(linksRes.data ?? []);
    setCustomers(cusRes.data ?? []);
    setLoading(false);
  };

  const onLink = async (linkId: string) => {
    const cid = selectedCustomers[linkId];
    if (!cid) return;
    if (await actions.handleLink(linkId, cid)) { showToast("顧客を紐付けました"); loadData(); }
  };

  const onUnlink = async (linkId: string) => {
    if (await actions.handleUnlink(linkId)) { showToast("紐付けを解除しました"); loadData(); }
  };

  const onTest = async (lineUserId: string, linkId: string) => {
    if (await actions.handleTest(lineUserId, linkId)) { showToast("テストメッセージを送信しました"); }
  };

  const onSync = async () => {
    const result = await actions.handleSync();
    if (result) { showToast(`${result.added}件の友だちを同期しました（全${result.total}件）`); loadData(); }
  };

  const linkedCustomerIds = new Set(links.filter((l) => l.customer_id).map((l) => l.customer_id));

  // ソート: 未紐付け（新しい順）→ 紐付け済み
  const sortedLinks = [...links].sort((a, b) => {
    if (!a.customer_id && b.customer_id) return -1;
    if (a.customer_id && !b.customer_id) return 1;
    return 0;
  });

  // 検索フィルタ
  const filteredLinks = sortedLinks.filter((link) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const lineName = (link.display_name ?? "").toLowerCase();
    const cust = link.customer_id ? customers.find((c) => c.id === link.customer_id) : null;
    const custName = cust ? `${cust.last_name}${cust.first_name}`.toLowerCase() : "";
    return lineName.includes(s) || custName.includes(s);
  });

  const unlinkedCount = links.filter((l) => !l.customer_id).length;

  if (loading) return null;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {actions.error && <ErrorAlert message={actions.error} />}

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold">LINE友だち管理</h3>
          <p className="text-xs text-text-light mt-0.5">
            {unlinkedCount > 0 ? `未紐付け ${unlinkedCount}件 / 全${links.length}件` : `全${links.length}件`}
          </p>
        </div>
        <button onClick={onSync} disabled={actions.syncing}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center disabled:opacity-50">
          {actions.syncing ? "同期中..." : "友だちを同期"}
        </button>
      </div>

      <p className="text-xs text-text-light mb-3">
        LINE公式アカウントの友だちと顧客を紐付けると、予約通知がLINEで届くようになります
      </p>

      {links.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">LINE友だちはまだいません</p>
          <p className="text-xs text-text-light mt-1">
            上の「友だちを同期」ボタンを押すか、LINE公式アカウントを友だち追加してもらうとここに表示されます
          </p>
        </div>
      ) : (
        <>
          {links.length >= 5 && (
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="LINE名・顧客名で検索"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors mb-3" />
          )}
          <div className="space-y-2">
            {filteredLinks.map((link) => (
              <LineLinkCard key={link.id} link={link} customers={customers}
                linkedCustomerIds={linkedCustomerIds}
                selectedCustomerId={selectedCustomers[link.id] ?? ""}
                onSelectCustomer={(id) => setSelectedCustomers((p) => ({ ...p, [link.id]: id }))}
                onLink={() => onLink(link.id)} onUnlink={() => onUnlink(link.id)}
                onTest={() => onTest(link.line_user_id, link.id)}
                saving={actions.savingId === link.id} testing={actions.testingId === link.id} />
            ))}
            {filteredLinks.length === 0 && search && (
              <p className="text-sm text-text-light text-center py-4">該当する友だちがいません</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
