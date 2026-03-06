"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLineLinkActions } from "@/hooks/use-line-link-actions";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import Link from "next/link";

type LineLink = {
  id: string;
  display_name: string | null;
  is_following: boolean;
  linked_at: string | null;
};

type UnlinkedFriend = {
  id: string;
  display_name: string | null;
  picture_url: string | null;
};

type Props = {
  lineLink: LineLink | null;
  customerId: string;
  salonId: string;
};

export function CustomerLineSection({ lineLink: initialLineLink, customerId, salonId }: Props) {
  const [lineLink, setLineLink] = useState(initialLineLink);
  const [unlinkedFriends, setUnlinkedFriends] = useState<UnlinkedFriend[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [showLinkUI, setShowLinkUI] = useState(false);
  const actions = useLineLinkActions();
  const { toast, showToast, hideToast } = useToast();

  // LINE連携済みだが未紐付けの友だちを取得
  useEffect(() => {
    if (lineLink) return; // 既に紐付け済み
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("customer_line_links")
        .select("id, display_name, picture_url")
        .eq("salon_id", salonId)
        .is("customer_id", null)
        .order("created_at", { ascending: false });
      setUnlinkedFriends(data ?? []);
    };
    load();
  }, [lineLink, salonId]);

  const handleLink = async () => {
    if (!selectedLinkId) return;
    if (await actions.handleLink(selectedLinkId, customerId)) {
      const friend = unlinkedFriends.find((f) => f.id === selectedLinkId);
      setLineLink({
        id: selectedLinkId,
        display_name: friend?.display_name ?? null,
        is_following: true,
        linked_at: new Date().toISOString(),
      });
      setShowLinkUI(false);
      setSelectedLinkId("");
      showToast("LINE友だちを紐付けました");
    }
  };

  const handleUnlink = async () => {
    if (!lineLink) return;
    if (await actions.handleUnlink(lineLink.id)) {
      setLineLink(null);
      showToast("LINE紐付けを解除しました");
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">LINE連携</h3>
        {actions.error && <ErrorAlert message={actions.error} />}

        {lineLink ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${lineLink.is_following ? "bg-green-500" : "bg-gray-300"}`} />
                <p className="text-sm">
                  {lineLink.display_name ?? "名前なし"}
                  {!lineLink.is_following && <span className="text-xs text-text-light ml-1">（ブロック中）</span>}
                </p>
              </div>
              <button
                onClick={handleUnlink}
                disabled={actions.savingId === lineLink.id}
                className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px] disabled:opacity-50"
              >
                {actions.savingId === lineLink.id ? "解除中..." : "解除"}
              </button>
            </div>
            {lineLink.linked_at && (
              <p className="text-xs text-text-light">
                紐付け日: {new Date(lineLink.linked_at).toLocaleDateString("ja-JP")}
              </p>
            )}
          </>
        ) : (
          <>
            {unlinkedFriends.length > 0 ? (
              showLinkUI ? (
                <div className="space-y-2">
                  <p className="text-xs text-text-light">
                    LINE友だちを選んで紐付けてください
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLinkId}
                      onChange={(e) => setSelectedLinkId(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="">LINE友だちを選択...</option>
                      {unlinkedFriends.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.display_name ?? "名前なし"}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleLink}
                      disabled={!selectedLinkId || actions.savingId !== null}
                      className="shrink-0 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      {actions.savingId ? "保存中..." : "紐付け"}
                    </button>
                  </div>
                  <button
                    onClick={() => { setShowLinkUI(false); setSelectedLinkId(""); }}
                    className="text-xs text-text-light hover:underline"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-light">未紐付け</p>
                  <button
                    onClick={() => setShowLinkUI(true)}
                    className="text-sm text-accent hover:underline font-medium min-h-[44px] flex items-center"
                  >
                    LINE友だちを紐付ける
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-text-light">未連携</p>
                <p className="text-xs text-text-light">
                  <Link href="/settings/line" className="text-accent hover:underline">
                    LINE連携設定
                  </Link>
                  で友だちを同期すると、ここから紐付けできます
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
