"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Toast, useToast } from "@/components/ui/toast";

type LineConfig = {
  id: string;
  webhook_secret: string;
  is_active: boolean;
  reminder_enabled: boolean;
  confirmation_enabled: boolean;
};

type Props = {
  onConnected: (config: LineConfig) => void;
};

export function LineSetupGuide({ onConnected }: Props) {
  const [form, setForm] = useState({
    channel_id: "",
    channel_secret: "",
    channel_access_token: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/line/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      showToast("LINE連携を設定しました");
      onConnected(data.config);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors font-mono text-sm";

  const linkClass = "text-accent hover:underline font-medium";

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* 手順ガイド */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-4">
        <p className="font-bold text-sm">LINE公式アカウントを連携する手順</p>

        {/* ステップ1 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">① LINE公式アカウントを作成</p>
          <p className="text-xs text-text-light leading-relaxed">
            まだLINE公式アカウントをお持ちでない場合は、
            <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE Official Account Manager
            </a>
            から無料で作成できます。
          </p>
          <p className="text-xs text-text-light">※ 無料プラン（月200通まで）で十分です。既にお持ちの場合は次へ進んでください。</p>
        </div>

        {/* ステップ2 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">② Messaging APIを有効にする</p>
          <p className="text-xs text-text-light leading-relaxed">
            <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE Official Account Manager
            </a>
            にログインし、右上の「設定」→ 左メニューの「Messaging API」→「Messaging APIを利用する」ボタンを押してください。
          </p>
          <p className="text-xs text-text-light">
            ※ プロバイダー名の入力を求められます。サロン名などを入力してください（後から変更できません）。
          </p>
        </div>

        {/* ステップ3 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">③ 認証情報をコピーして下のフォームに貼り付け</p>
          <p className="text-xs text-text-light leading-relaxed">
            <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE Developers Console
            </a>
            を開き、②で作成されたチャネルを選択してください。
          </p>
          <div className="bg-white/50 rounded-lg p-3 space-y-1.5 mt-1.5">
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">チャネルID</span>：「チャネル基本設定」タブに表示されています
            </p>
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">チャネルシークレット</span>：「チャネル基本設定」タブの下部にあります
            </p>
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">チャネルアクセストークン</span>：「Messaging API設定」タブ →「チャネルアクセストークン（長期）」の「発行」ボタンを押してコピー
            </p>
          </div>
        </div>
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">チャネル情報を入力</h3>

        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            チャネルID <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.channel_id}
            onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
            placeholder="例: 1234567890"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            チャネルシークレット <span className="text-error">*</span>
          </label>
          <input
            type="password"
            value={form.channel_secret}
            onChange={(e) => setForm({ ...form, channel_secret: e.target.value })}
            placeholder="チャネル基本設定からコピー"
            required
            className={inputClass}
          />
          <p className="text-xs text-text-light mt-1">暗号化して保存されます</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            チャネルアクセストークン <span className="text-error">*</span>
          </label>
          <input
            type="password"
            value={form.channel_access_token}
            onChange={(e) => setForm({ ...form, channel_access_token: e.target.value })}
            placeholder="Messaging API設定から発行してコピー"
            required
            className={inputClass}
          />
          <p className="text-xs text-text-light mt-1">暗号化して保存されます</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>
    </>
  );
}
