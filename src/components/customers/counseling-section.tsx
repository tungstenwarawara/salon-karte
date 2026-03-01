"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { Database } from "@/types/database";
import type { CounselingTemplate } from "@/types/counseling-template";
import { ResponseViewer } from "@/components/counseling/response-viewer";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";

type CounselingSheet = Database["public"]["Tables"]["counseling_sheets"]["Row"];

type TemplateItem = {
  id: string;
  name: string;
  template: CounselingTemplate;
  is_default: boolean;
};

type Props = {
  customerId: string;
  salonId: string;
  sheets: CounselingSheet[];
  counselingTemplate: CounselingTemplate | null;
  templates: TemplateItem[];
};

export function CounselingSection({ customerId, salonId, sheets: initialSheets, counselingTemplate, templates }: Props) {
  const [sheets, setSheets] = useState(initialSheets);
  const [creating, setCreating] = useState(false);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllSubmitted, setShowAllSubmitted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submitted = sheets.filter((s) => s.status === "submitted");
  const pending = sheets.filter((s) => s.status === "pending" && new Date(s.expires_at) > new Date());
  const displaySubmitted = showAllSubmitted ? submitted : submitted.slice(0, 1);
  const hasMoreSubmitted = submitted.length > 1;

  const handleCreateClick = () => {
    setSelectedTemplateId(templates.find((t) => t.is_default)?.id ?? templates[0]?.id ?? null);
    setShowTemplateSelect(true);
  };

  const handleCreate = async (templateId: string | null) => {
    setCreating(true);
    setShowTemplateSelect(false);
    try {
      const res = await fetch("/api/counseling/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          template_id: templateId,
          include_customer_info: includeCustomerInfo,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.token);
        const url = getUrl(data.token);
        const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
        setQrDataUrl(dataUrl);
        setShowQr(true);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (sheetId: string) => {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("counseling_sheets")
      .delete()
      .eq("id", sheetId)
      .eq("salon_id", salonId);

    if (!error) {
      setSheets((prev) => prev.filter((s) => s.id !== sheetId));
      setConfirmDeleteId(null);
    } else {
      console.error("シート削除エラー:", error);
    }
    setDeleting(false);
  };

  const getUrl = (token: string) => `${window.location.origin}/c/${token}`;

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(getUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowQr = async (token: string) => {
    if (showQr) { setShowQr(false); return; }
    const url = getUrl(token);
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
    setQrDataUrl(dataUrl);
    setShowQr(true);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const hasContent = submitted.length > 0 || pending.length > 0 || generatedToken;

  const getTemplateForSheet = (sheet: CounselingSheet): CounselingTemplate | null => {
    if (sheet.template_id) {
      const found = templates.find((t) => t.id === sheet.template_id);
      if (found) return found.template;
    }
    return counselingTemplate;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">カウンセリングシート</h3>
        <button
          onClick={handleCreateClick}
          disabled={creating}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center disabled:opacity-50"
        >
          {creating ? "発行中..." : "+ シート発行"}
        </button>
      </div>

      {/* テンプレート選択 + オプションUI */}
      {showTemplateSelect && (
        <div className="bg-background rounded-xl p-3 space-y-3 mb-3">
          {templates.length > 1 && (
            <>
              <p className="text-sm font-medium">テンプレートを選択</p>
              <div className="space-y-2">
                {templates.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      checked={selectedTemplateId === t.id}
                      onChange={() => setSelectedTemplateId(t.id)}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm">{t.name}</span>
                    {t.is_default && <span className="text-xs text-accent">デフォルト</span>}
                  </label>
                ))}
              </div>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeCustomerInfo}
              onChange={(e) => setIncludeCustomerInfo(e.target.checked)}
              className="w-4 h-4 accent-accent flex-shrink-0"
            />
            <span className="text-sm">顧客情報の入力も含める</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateSelect(false)}
              className="flex-1 border border-border rounded-xl py-2 text-sm min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleCreate(selectedTemplateId)}
              disabled={creating}
              className="flex-1 bg-accent text-white rounded-xl py-2 text-sm min-h-[44px] disabled:opacity-50"
            >
              発行する
            </button>
          </div>
        </div>
      )}

      {hasContent ? (
        <div className="space-y-2">
          {displaySubmitted.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light">
                  {s.submitted_at ? formatDate(s.submitted_at) : ""} 回答済み
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="text-xs text-accent hover:underline min-h-[44px] px-2"
                  >
                    {expandedId === s.id ? "閉じる" : "回答を見る"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === s.id ? null : s.id)}
                    className="text-xs text-error hover:bg-error/5 px-2 py-1.5 rounded-lg min-h-[44px]"
                    aria-label="削除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              {confirmDeleteId === s.id && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-medium text-red-800">このシートを削除しますか？</p>
                  <p className="text-xs text-red-700">回答内容も失われます</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px]">
                      キャンセル
                    </button>
                    <button onClick={() => handleDelete(s.id)} disabled={deleting} className="flex-1 text-xs bg-error text-white rounded-xl py-2 min-h-[44px] disabled:opacity-50">
                      {deleting ? "削除中..." : "削除する"}
                    </button>
                  </div>
                </div>
              )}
              {expandedId === s.id && <ResponseViewer responses={s.responses as Record<string, unknown> | null} template={getTemplateForSheet(s)} />}
            </div>
          ))}
          {hasMoreSubmitted && (
            <button
              onClick={() => setShowAllSubmitted(!showAllSubmitted)}
              className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
            >
              {showAllSubmitted ? "閉じる" : `過去の回答を見る（${submitted.length - 1}件）`}
            </button>
          )}

          {pending.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light">{formatDate(s.expires_at)} まで有効</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">未回答</span>
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === s.id ? null : s.id)}
                    className="text-xs text-error hover:bg-error/5 px-2 py-1.5 rounded-lg min-h-[44px]"
                    aria-label="削除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              {confirmDeleteId === s.id && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-medium text-red-800">このシートを削除しますか？</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px]">
                      キャンセル
                    </button>
                    <button onClick={() => handleDelete(s.id)} disabled={deleting} className="flex-1 text-xs bg-error text-white rounded-xl py-2 min-h-[44px] disabled:opacity-50">
                      {deleting ? "削除中..." : "削除する"}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleCopy(s.token)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors">
                  {copied ? "コピーしました" : "URLをコピー"}
                </button>
                <button onClick={() => handleShowQr(s.token)} className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors">
                  QR
                </button>
              </div>
              {showQr && qrDataUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QRコード" width={200} height={200} />
                </div>
              )}
            </div>
          ))}

          {generatedToken && !pending.some((p) => p.token === generatedToken) && (
            <div className="bg-accent/5 border border-accent/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-text-light">リンクが発行されました（7日間有効）</p>
              <div className="flex gap-2">
                <button onClick={() => handleCopy(generatedToken)} className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors">
                  {copied ? "コピーしました" : "URLをコピー"}
                </button>
                <button onClick={() => handleShowQr(generatedToken)} className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors">
                  QR
                </button>
              </div>
              {showQr && qrDataUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QRコード" width={200} height={200} />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          illustration="clipboard"
          message="カウンセリングシートはまだありません"
        />
      )}
    </div>
  );
}
