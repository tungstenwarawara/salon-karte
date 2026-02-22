"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Toast, useToast } from "@/components/ui/toast";
import { ToggleRow } from "@/components/ui/toggle-row";

type LineConfig = {
  id: string;
  webhook_secret: string;
  is_active: boolean;
  reminder_enabled: boolean;
  confirmation_enabled: boolean;
};

type Props = {
  config: LineConfig;
  onUpdate: (config: LineConfig) => void;
  onDisconnect: () => void;
};

export function LineStatus({ config, onUpdate, onDisconnect }: Props) {
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/line/webhook/${config.webhook_secret}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async (field: "is_active" | "reminder_enabled" | "confirmation_enabled") => {
    setError("");
    setUpdating(true);
    try {
      const res = await fetch("/api/line/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !config[field] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新に失敗しました");
        return;
      }
      onUpdate({ ...config, ...data.config });
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnect = async () => {
    setError("");
    setUpdating(true);
    try {
      const res = await fetch("/api/line/config", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "解除に失敗しました");
        return;
      }
      showToast("LINE連携を解除しました");
      onDisconnect();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setUpdating(false);
      setConfirming(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* 接続状態 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.is_active ? "bg-green-500" : "bg-gray-300"}`} />
          <h3 className="font-bold">{config.is_active ? "LINE連携中" : "LINE連携（停止中）"}</h3>
        </div>

        {error && <ErrorAlert message={error} />}

        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Webhook URL</label>
          <div className="text-xs text-text-light mb-2 space-y-1">
            <p>
              <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                LINE Developers Console
              </a>
              で以下を設定してください：
            </p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>「Messaging API設定」タブを開く</li>
              <li>「Webhook URL」に下のURLを貼り付けて「更新」</li>
              <li>「検証」ボタンを押して「成功」と表示されることを確認</li>
              <li>「Webhookの利用」をONにする</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-xs font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px]"
            >
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
        </div>

        {/* トグル設定 */}
        <div className="space-y-3 pt-2 border-t border-border">
          <ToggleRow
            label="LINE連携を有効にする"
            description="OFFにすると全てのLINE通知が停止します"
            checked={config.is_active}
            disabled={updating}
            onChange={() => handleToggle("is_active")}
          />
          <ToggleRow
            label="予約確認通知"
            description="予約作成時にLINEで通知を送信"
            checked={config.confirmation_enabled}
            disabled={updating || !config.is_active}
            onChange={() => handleToggle("confirmation_enabled")}
          />
          <ToggleRow
            label="前日リマインド"
            description="予約前日の21時にリマインドを送信"
            checked={config.reminder_enabled}
            disabled={updating || !config.is_active}
            onChange={() => handleToggle("reminder_enabled")}
          />
        </div>
      </div>

      {/* 連携解除 */}
      <div className="pt-2">
        {confirming ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
            <p className="text-sm text-error font-medium">LINE連携を解除しますか？</p>
            <p className="text-xs text-text-light">チャネル情報と全ての紐付けデータが削除されます。この操作は取り消せません。</p>
            <div className="flex gap-2">
              <button
                onClick={handleDisconnect}
                disabled={updating}
                className="flex-1 bg-error hover:bg-error/90 text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {updating ? "解除中..." : "解除する"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-background border border-border text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full text-center text-sm text-error hover:text-error/80 py-3 transition-colors min-h-[44px]"
          >
            LINE連携を解除する
          </button>
        )}
      </div>
    </>
  );
}
