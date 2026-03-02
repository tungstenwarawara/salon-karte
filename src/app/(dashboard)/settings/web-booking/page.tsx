"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";

export default function WebBookingSettingsPage() {
  const [salonId, setSalonId] = useState("");
  const [slug, setSlug] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  // DB上の値を追跡して保存ボタンの表示を制御
  const savedSlugRef = useRef("");

  useEffect(() => {
    const load = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);
      const supabase = createClient();
      const { data } = await supabase
        .from("salons")
        .select("booking_slug, booking_enabled")
        .eq("id", sid)
        .single();
      if (data) {
        setSlug(data.booking_slug ?? "");
        savedSlugRef.current = data.booking_slug ?? "";
        setEnabled(data.booking_enabled ?? false);
      }
      setLoading(false);
    };
    load();
  }, []);

  // slug バリデーション
  const validateSlug = useCallback((value: string): string => {
    if (!value) return "";
    if (value.length < 3) return "3文字以上で入力してください";
    if (value.length > 50) return "50文字以内で入力してください";
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) {
      return "英小文字・数字・ハイフンのみ使用できます（先頭と末尾はハイフン不可）";
    }
    return "";
  }, []);

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);
    setSlugError(validateSlug(sanitized));
  };

  // トグル変更時に即座にDBへ保存
  const handleToggle = async () => {
    if (!salonId) return;
    setError("");
    const newEnabled = !enabled;

    // ONにする場合はslug必須
    if (newEnabled && !slug.trim()) {
      setSlugError("URLを設定してから公開してください");
      return;
    }
    if (newEnabled && slug && validateSlug(slug)) {
      setSlugError(validateSlug(slug));
      return;
    }

    setToggling(true);
    setEnabled(newEnabled);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ booking_enabled: newEnabled })
      .eq("id", salonId);

    if (updateError) {
      // 失敗時は元に戻す
      setEnabled(!newEnabled);
      setError(`切り替えに失敗しました: ${updateError.message}`);
      console.error("toggle booking error:", updateError);
    } else {
      showToast(newEnabled ? "予約ページを公開しました" : "予約ページを非公開にしました");
    }
    setToggling(false);
  };

  // slug保存（URLの変更のみ）
  const handleSave = async () => {
    setError("");
    if (!salonId) { setError("認証エラー"); return; }

    if (slug && validateSlug(slug)) {
      setSlugError(validateSlug(slug));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ booking_slug: slug.trim() || null })
      .eq("id", salonId);

    if (updateError) {
      if (updateError.message?.includes("duplicate") || updateError.message?.includes("unique")) {
        setError("このURLは既に使用されています。別のURLをお試しください。");
      } else {
        setError(`保存に失敗しました: ${updateError.message}`);
      }
      console.error("web-booking settings error:", updateError);
    } else {
      savedSlugRef.current = slug.trim();
      showToast("予約ページURLを保存しました");
    }
    setSaving(false);
  };

  const bookingUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${slug}` : "";
  const slugChanged = slug.trim() !== savedSlugRef.current;

  const handleCopy = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="Web予約ページ"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "Web予約ページ" },
        ]}
      />

      {/* 公開設定 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
        {error && <ErrorAlert message={error} />}

        {/* 公開 ON/OFF（即時保存） */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">予約ページを公開</h3>
            <p className="text-xs text-text-light mt-0.5">
              切り替えると即座に反映されます
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            disabled={toggling}
            className={`relative w-12 h-7 rounded-full transition-colors ${toggling ? "opacity-60" : ""} ${enabled ? "bg-accent" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* 状態表示 */}
        <div className={`flex items-center gap-2 text-sm ${enabled && slug && !slugError ? "text-green-600" : "text-text-light"}`}>
          <div className={`w-2 h-2 rounded-full ${enabled && slug && !slugError ? "bg-green-500 animate-pulse" : "bg-border"}`} />
          {enabled && slug && !slugError ? "公開中 — お客様が予約できます" : "非公開"}
        </div>

        {/* 予約ページ URL */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm">予約ページURL</h3>
          <div className="flex items-center gap-1 text-sm text-text-light">
            <span className="shrink-0">/book/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-salon"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[44px] text-foreground"
            />
          </div>
          {slugError && <p className="text-xs text-error">{slugError}</p>}
          <p className="text-xs text-text-light">
            英小文字・数字・ハイフンが使えます（3〜50文字）
          </p>
        </div>

        {/* URL プレビュー + コピー */}
        {slug && !slugError && (
          <div className="bg-background rounded-xl p-3 space-y-2">
            <p className="text-xs text-text-light">予約ページURL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-accent break-all">{bookingUrl}</code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/5 transition-colors min-h-[36px]"
              >
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 関連設定へのリンク */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
        <h3 className="font-bold text-sm text-text-light">関連設定</h3>
        <p className="text-sm text-text-light leading-relaxed">
          予約受付ルール（当日予約・締切時間・同時予約数）は
          <Link href="/settings/booking-rules" className="text-accent hover:underline mx-1">
            予約受付設定
          </Link>
          で変更できます。
        </p>
      </div>

      {/* URL変更時のみ保存ボタン表示 */}
      {slugChanged && (
        <SubmitButton type="button" onClick={handleSave} loading={saving} className="w-full" />
      )}
    </div>
  );
}
