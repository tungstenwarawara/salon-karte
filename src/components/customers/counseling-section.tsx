"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { Database } from "@/types/database";
import { ResponseViewer } from "@/components/counseling/response-viewer";
import type { CounselingResponses } from "@/components/counseling/response-viewer";

type CounselingSheet = Database["public"]["Tables"]["counseling_sheets"]["Row"];

type Props = {
  customerId: string;
  sheets: CounselingSheet[];
};

export function CounselingSection({ customerId, sheets }: Props) {
  const [creating, setCreating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllSubmitted, setShowAllSubmitted] = useState(false);

  // 最新のsubmitted + pendingを取得
  const submitted = sheets.filter((s) => s.status === "submitted");
  const pending = sheets.filter((s) => s.status === "pending" && new Date(s.expires_at) > new Date());
  const displaySubmitted = showAllSubmitted ? submitted : submitted.slice(0, 1);
  const hasMoreSubmitted = submitted.length > 1;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/counseling/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.token);
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
    if (showQr) {
      setShowQr(false);
      return;
    }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">カウンセリングシート</h3>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center disabled:opacity-50"
        >
          {creating ? "発行中..." : "+ シート発行"}
        </button>
      </div>

      {hasContent ? (
        <div className="space-y-2">
          {/* 回答済み一覧 */}
          {displaySubmitted.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light">
                  {s.submitted_at ? formatDate(s.submitted_at) : ""} 回答済み
                </span>
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="text-xs text-accent hover:underline min-h-[44px] px-2"
                >
                  {expandedId === s.id ? "閉じる" : "回答を見る"}
                </button>
              </div>
              {expandedId === s.id && <ResponseViewer responses={s.responses as CounselingResponses | null} />}
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

          {/* 発行済み（未回答） */}
          {pending.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light">
                  {formatDate(s.expires_at)} まで有効
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">未回答</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(s.token)}
                  className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors"
                >
                  {copied ? "コピーしました" : "URLをコピー"}
                </button>
                <button
                  onClick={() => handleShowQr(s.token)}
                  className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors"
                >
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

          {/* 新規生成されたトークン */}
          {generatedToken && !pending.some((p) => p.token === generatedToken) && (
            <div className="bg-accent/5 border border-accent/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-text-light">リンクが発行されました（7日間有効）</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(generatedToken)}
                  className="flex-1 text-xs border border-border rounded-xl py-2 min-h-[44px] hover:bg-background transition-colors"
                >
                  {copied ? "コピーしました" : "URLをコピー"}
                </button>
                <button
                  onClick={() => handleShowQr(generatedToken)}
                  className="text-xs border border-border rounded-xl px-3 py-2 min-h-[44px] hover:bg-background transition-colors"
                >
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
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">カウンセリングシートはまだありません</p>
        </div>
      )}
    </div>
  );
}
