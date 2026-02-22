"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Toast, useToast } from "@/components/ui/toast";

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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!salon) return;

    const [linksResult, customersResult] = await Promise.all([
      supabase
        .from("customer_line_links")
        .select("id, line_user_id, display_name, picture_url, is_following, customer_id, linked_at")
        .eq("salon_id", salon.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("id, last_name, first_name")
        .eq("salon_id", salon.id)
        .order("last_name", { ascending: true }),
    ]);

    setLinks(linksResult.data ?? []);
    setCustomers(customersResult.data ?? []);
    setLoading(false);
  };

  const handleLink = async (linkId: string) => {
    const customerId = selectedCustomers[linkId];
    if (!customerId) return;
    setError("");
    setSavingId(linkId);

    try {
      const res = await fetch("/api/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, customer_id: customerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "紐付けに失敗しました");
        return;
      }
      showToast("顧客を紐付けました");
      loadData();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  };

  const handleUnlink = async (linkId: string) => {
    setError("");
    setSavingId(linkId);

    try {
      const res = await fetch("/api/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, customer_id: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "解除に失敗しました");
        return;
      }
      showToast("紐付けを解除しました");
      loadData();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  };

  const handleTest = async (lineUserId: string, linkId: string) => {
    setError("");
    setTestingId(linkId);

    try {
      const res = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_user_id: lineUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "テスト送信に失敗しました");
        return;
      }
      showToast("テストメッセージを送信しました");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setTestingId(null);
    }
  };

  // 既に紐付け済みの顧客IDを除外
  const linkedCustomerIds = new Set(links.filter((l) => l.customer_id).map((l) => l.customer_id));

  if (loading) return null;

  if (links.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-light text-sm">LINE友だちはまだいません</p>
        <p className="text-xs text-text-light mt-1">
          LINE公式アカウントを友だち追加すると、ここに表示されます
        </p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {error && <ErrorAlert message={error} />}

      <div className="space-y-2">
        {links.map((link) => {
          const linkedCustomer = link.customer_id
            ? customers.find((c) => c.id === link.customer_id)
            : null;

          return (
            <div key={link.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {/* アバター */}
                  {link.picture_url ? (
                    <img src={link.picture_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-border shrink-0 flex items-center justify-center text-xs text-text-light">
                      {(link.display_name ?? "?")[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{link.display_name ?? "名前なし"}</p>
                    {!link.is_following && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">ブロック中</span>
                    )}
                  </div>
                </div>

                {/* テスト送信 */}
                {link.is_following && (
                  <button
                    onClick={() => handleTest(link.line_user_id, link.id)}
                    disabled={testingId === link.id}
                    className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px] disabled:opacity-50"
                  >
                    {testingId === link.id ? "送信中..." : "テスト送信"}
                  </button>
                )}
              </div>

              {/* 紐付け状態 */}
              {linkedCustomer ? (
                <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                  <p className="text-sm">
                    <span className="text-text-light text-xs mr-1">紐付け:</span>
                    {linkedCustomer.last_name} {linkedCustomer.first_name}
                  </p>
                  <button
                    onClick={() => handleUnlink(link.id)}
                    disabled={savingId === link.id}
                    className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px] disabled:opacity-50"
                  >
                    解除
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCustomers[link.id] ?? ""}
                    onChange={(e) => setSelectedCustomers((prev) => ({ ...prev, [link.id]: e.target.value }))}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">顧客を選択...</option>
                    {customers
                      .filter((c) => !linkedCustomerIds.has(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.last_name} {c.first_name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleLink(link.id)}
                    disabled={!selectedCustomers[link.id] || savingId === link.id}
                    className="shrink-0 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {savingId === link.id ? "保存中..." : "紐付け"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
