"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Toast, useToast } from "@/components/ui/toast";
import { HelpTip } from "@/components/ui/help-tip";

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
        <p className="font-bold text-sm">LINE公式アカウントと連携する手順（約5分）</p>

        {/* ステップ1 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">① LINE公式アカウントを用意する</p>
          <p className="text-xs text-text-light leading-relaxed">
            まだお持ちでない場合は、
            <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE公式アカウント管理画面
            </a>
            から無料で作成できます。
          </p>
          <p className="text-xs text-text-light">※ 無料プラン（月200通まで）で十分です。既にお持ちの場合は②へ。</p>
        </div>

        {/* ステップ2 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">② LINE公式アカウントの「メッセージ送信機能」を有効にする</p>
          <p className="text-xs text-text-light leading-relaxed">
            <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE公式アカウント管理画面
            </a>
            にログインし、右上の「設定」→ 左メニューの「Messaging API」→「Messaging APIを利用する」ボタンを押してください。
          </p>
          <p className="text-xs text-text-light">
            ※ 「プロバイダー名」にはサロン名などを入力してください。
          </p>
        </div>

        {/* ステップ3 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">③ 3つの接続番号をコピーして下のフォームに貼り付ける</p>
          <p className="text-xs text-text-light leading-relaxed">
            <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className={linkClass}>
              LINE Developers（開発者向け管理画面）
            </a>
            を開き、②で作成されたアカウントを選んでください。
          </p>
          <div className="bg-white/50 rounded-lg p-3 space-y-1.5 mt-1.5">
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">接続番号（チャネルID）</span>：「チャネル基本設定」タブに表示されている数字
            </p>
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">秘密キー（チャネルシークレット）</span>：同じタブの下部にある英数字の文字列
            </p>
            <p className="text-xs text-text-light">
              <span className="font-medium text-text">送信キー（アクセストークン）</span>：「Messaging API設定」タブ →「チャネルアクセストークン（長期）」の「発行」ボタンを押してコピー
            </p>
          </div>
        </div>
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">接続情報を入力</h3>

        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            接続番号（チャネルID）
            <HelpTip>LINE Developersの「チャネル基本設定」タブに表示されている数字です。コピーしてそのまま貼り付けてください。</HelpTip>
            <span className="text-error ml-0.5">*</span>
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
            秘密キー（チャネルシークレット）
            <HelpTip>「チャネル基本設定」タブの下部にある英数字の文字列です。salon-karteが本物のLINEからのメッセージかを確認するために使います。暗号化して安全に保存されます。</HelpTip>
            <span className="text-error ml-0.5">*</span>
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
            送信キー（チャネルアクセストークン）
            <HelpTip>salon-karteがお客様にLINEメッセージを送るために必要なキーです。「Messaging API設定」タブで「発行」ボタンを押すと表示されます。暗号化して安全に保存されます。</HelpTip>
            <span className="text-error ml-0.5">*</span>
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

        <SubmitButton loading={loading} className="w-full" />
      </form>
    </>
  );
}
