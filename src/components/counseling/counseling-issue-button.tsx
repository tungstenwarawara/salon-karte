"use client";

import { useState } from "react";

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
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const sheetUrl = token ? `${window.location.origin}/c/${token}` : null;

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "発行に失敗しました");
        setIssuing(false);
        return;
      }
      setToken(data.token);
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

  // 既に発行済みのURLがある場合
  if (hasPendingSheet && token) {
    return (
      <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium">カウンセリングシート（発行済み）</p>
        <p className="text-xs text-text-light break-all">{sheetUrl}</p>
        <button type="button" onClick={handleCopy} className="w-full bg-accent/10 text-accent font-medium rounded-lg py-2 text-sm min-h-[44px]">
          {copied ? "コピーしました" : "URLをコピー"}
        </button>
      </div>
    );
  }

  // 発行後のURL表示
  if (token) {
    return (
      <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium">カウンセリングシートを発行しました</p>
        <p className="text-xs text-text-light break-all">{sheetUrl}</p>
        <button type="button" onClick={handleCopy} className="w-full bg-accent/10 text-accent font-medium rounded-lg py-2 text-sm min-h-[44px]">
          {copied ? "コピーしました" : "URLをコピー"}
        </button>
      </div>
    );
  }

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
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleIssue}
        disabled={issuing}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-lg py-2 text-sm min-h-[44px] transition-colors disabled:opacity-50"
      >
        {issuing ? "発行中..." : "シートを発行してURLを取得"}
      </button>
      <p className="text-[10px] text-text-light">URLをLINEやメールで送信し、来店前に記入してもらえます</p>
    </div>
  );
}
