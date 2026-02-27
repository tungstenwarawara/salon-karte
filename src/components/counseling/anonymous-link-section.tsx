"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { CounselingTemplate } from "@/types/counseling-template";

type TemplateItem = {
  id: string;
  name: string;
  template: CounselingTemplate;
  is_default: boolean;
};

type PendingSheet = {
  id: string;
  token: string;
  expires_at: string;
  template_id: string | null;
};

type Props = {
  salonId: string;
  templates: TemplateItem[];
};

export function AnonymousLinkSection({ salonId, templates }: Props) {
  const [creating, setCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    templates.find((t) => t.is_default)?.id ?? templates[0]?.id ?? null
  );
  const [pendingSheets, setPendingSheets] = useState<PendingSheet[]>([]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrToken, setShowQrToken] = useState<string | null>(null);

  const loadPendingSheets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("counseling_sheets")
      .select("id, token, expires_at, template_id")
      .eq("salon_id", salonId)
      .is("customer_id", null)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setPendingSheets(data ?? []);
  }, [salonId]);

  useEffect(() => { loadPendingSheets(); }, [loadPendingSheets]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/counseling/create-anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedTemplateId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.token);
        await loadPendingSheets();
      }
    } finally {
      setCreating(false);
    }
  };

  const getUrl = (token: string) => `${window.location.origin}/c/${token}`;

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(getUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowQr = async (token: string) => {
    if (showQrToken === token) { setShowQrToken(null); return; }
    const dataUrl = await QRCode.toDataURL(getUrl(token), { width: 200, margin: 2 });
    setQrDataUrl(dataUrl);
    setShowQrToken(token);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getTemplateName = (templateId: string | null) =>
    templates.find((t) => t.id === templateId)?.name ?? "デフォルト";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">新規顧客用リンク</h3>
      </div>

      <p className="text-xs text-text-light mb-3">
        まだ顧客登録していない方にカウンセリングシートを送れます。基本情報も顧客自身が入力し、送信時に自動で顧客登録されます。
      </p>

      {/* テンプレート選択 + 発行ボタン */}
      <div className="bg-surface border border-border rounded-xl p-3 space-y-3 mb-3">
        {templates.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">テンプレートを選択</p>
            {templates.map((t) => (
              <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background cursor-pointer">
                <input
                  type="radio"
                  name="anon-template"
                  checked={selectedTemplateId === t.id}
                  onChange={() => setSelectedTemplateId(t.id)}
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm">{t.name}</span>
              </label>
            ))}
          </div>
        )}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl py-3 transition-colors min-h-[48px] disabled:opacity-50"
        >
          {creating ? "発行中..." : "新規顧客用リンクを発行"}
        </button>
      </div>

      {/* 新規生成されたトークン */}
      {generatedToken && (
        <div className="bg-accent/5 border border-accent/30 rounded-xl p-3 space-y-2 mb-3">
          <p className="text-xs text-text-light">リンクが発行されました（7日間有効）</p>
          <div className="flex gap-2">
            <button onClick={() => handleCopy(generatedToken)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors">
              {copied ? "コピーしました" : "URLをコピー"}
            </button>
            <button onClick={() => handleShowQr(generatedToken)} className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors">
              QR
            </button>
          </div>
          {showQrToken === generatedToken && qrDataUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QRコード" width={200} height={200} />
            </div>
          )}
        </div>
      )}

      {/* 発行済み匿名リンク一覧 */}
      {pendingSheets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-light font-medium">発行済み（未回答）</p>
          {pendingSheets.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-text-light">{formatDate(s.expires_at)} まで有効</span>
                  {templates.length > 1 && (
                    <span className="text-xs text-accent ml-2">{getTemplateName(s.template_id)}</span>
                  )}
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">未回答</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopy(s.token)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors">
                  URLをコピー
                </button>
                <button onClick={() => handleShowQr(s.token)} className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors">
                  QR
                </button>
              </div>
              {showQrToken === s.token && qrDataUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QRコード" width={200} height={200} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
