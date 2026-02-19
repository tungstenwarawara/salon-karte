"use client";

import { useRef, useEffect, useCallback } from "react";

type AutoResizeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** 最小行数（デフォルト: 2） */
  minRows?: number;
};

/**
 * 入力量に応じて自動で高さが伸びるtextarea。
 * minRowsで初期の最小高さを指定可能。
 */
export function AutoResizeTextarea({
  minRows = 2,
  value,
  onChange,
  className,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 一度高さをリセットしてからscrollHeightを取得
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // 値が変わるたびに高さを調整
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // 初回マウント時にも調整（編集画面で既存データがある場合）
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={minRows}
      className={`${className ?? ""} resize-none overflow-hidden`}
      {...props}
    />
  );
}
