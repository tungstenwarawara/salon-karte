"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

type Template = {
  id: string;
  name: string;
  is_default: boolean;
};

type Props = {
  customerId: string;
  templates: Template[];
  hasPendingSheet: boolean;
  pendingSheetToken?: string | null;
};

export function CounselingIssueButton({ customerId, templates, hasPendingSheet, pendingSheetToken }: Props) {
  const [issuing, setIssuing] = useState(false);
  const [token, setToken] = useState<string | null>(pendingSheetToken ?? null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates.find((t) => t.is_default)?.id ?? templates[0]?.id ?? ""
  );
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const sheetUrl = token ? `${window.location.origin}/c/${token}` : null;

  // QRコード生成
  const generateQr = async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
    } catch {
      // QR生成失敗は致命的ではない
    }
  };

  // 発行済みシートのQRを初回表示時に生成
  useEffect(() => {
    if (hasPendingSheet && token && sheetUrl && !qrDataUrl) {
      generateQr(sheetUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingSheet, token]);

  const handleIssue = async () => {
    setIssuing(true);
    setError("");
    try {
      const res = await fetch("/api/counseling/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          template_id: selectedTemplateId || null,
          include_customer_info: includeCustomerInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "発行に失敗しました");
        setIssuing(false);
        return;
      }
      setToken(data.token);
      const url = `${window.location.origin}/c/${data.token}`;
      await generateQr(url);
    } catch {
      setError("通信エラーが発生しました");
    }
    setIssuing(false);
  };

  const handleCopy = async () => {
    if (!sheetUrl) return;
    await navigator.clipboard.writeText(sheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // URL + QR表示ブロック（発行済み・新規発行後で共用）
  if (token && sheetUrl) {
    return (
      <div className="bg-surface border border-border rounded-xl p-3 space-y-3">
        <p className="text-sm font-medium">
          {hasPendingSheet ? "カウンセリングシート（発行済み）" : "カウンセリングシートを発行しました"}
        </p>
        <p className="text-xs text-text-light break-all">{sheetUrl}</p>
        <button type="button" onClick={handleCopy} className="w-full bg-accent/10 text-accent font-medium rounded-lg py-2 text-sm min-h-[44px]">
          {copied ? "コピーしました" : "URLをコピー"}
        </button>
        {qrDataUrl && (
          <div className="flex justify-center">
            <img src={qrDataUrl} alt="QRコード" width={160} height={160} className="rounded-lg" />
          </div>
        )}
        <p className="text-[10px] text-text-light text-center">QRコードを見せるか、URLをLINE・メールで送信してください</p>
      </div>
    );
  }

  // 未発行: テンプレート選択 + チェックボックス + 発行ボタン
  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium">カウンセリングシート</p>
      {templates.length > 1 && (
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
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
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleIssue}
        disabled={issuing}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-lg py-2 text-sm min-h-[44px] transition-colors disabled:opacity-50"
      >
        {issuing ? "発行中..." : "シートを発行"}
      </button>
      <p className="text-[10px] text-text-light">URLとQRコードが発行されます</p>
    </div>
  );
}
