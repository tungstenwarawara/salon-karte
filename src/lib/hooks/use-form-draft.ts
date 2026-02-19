"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * フォームの下書きをlocalStorageに自動保存するフック
 *
 * @param key - 保存キー（例: "customer-new"）
 * @param form - 現在のフォーム状態
 * @param setForm - フォーム状態を更新する関数
 * @returns { clearDraft, draftRestored } - 下書きクリア関数と復元フラグ
 */
export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  form: T,
  setForm: (val: T) => void
) {
  const [draftRestored, setDraftRestored] = useState(false);
  const isInitializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const storageKey = `draft_${key}`;

  // マウント時に下書きを復元（1回だけ）
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        // 空のフォームとの差分がある場合のみ復元
        const hasContent = Object.values(parsed).some(
          (v) => v !== "" && v !== null && v !== undefined
        );
        if (hasContent) {
          setForm(parsed);
          setDraftRestored(true);
        }
      }
    } catch {
      // パースエラーは無視
    }
  }, [storageKey, setForm]);

  // 2秒デバウンスで自動保存
  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
      } catch {
        // ストレージ容量不足は無視
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [storageKey, form]);

  // 下書きをクリア（送信成功時に呼ぶ）
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // 復元バナーを閉じる
  const dismissDraftBanner = useCallback(() => {
    setDraftRestored(false);
  }, []);

  return { clearDraft, draftRestored, dismissDraftBanner };
}
