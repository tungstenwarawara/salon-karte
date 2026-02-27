"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type LightboxPhoto = {
  url: string;
  label?: string;
  memo?: string;
  date?: string;
};

type Props = {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
};

export function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const photo = photos[currentIndex];
  const total = photos.length;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < total - 1 ? i + 1 : i));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  // キーボード操作
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // タッチスワイプ
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  // 背景タップで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) onClose();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* ヘッダー: カウンター + 閉じるボタン */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/80 text-sm">
          {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          {photo?.date && (
            <span className="text-white/60 text-xs">
              {new Date(photo.date).toLocaleDateString("ja-JP")}
            </span>
          )}
          {photo?.label && (
            <span className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full">
              {photo.label}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white min-w-[48px] min-h-[48px] flex items-center justify-center text-2xl"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      {/* 写真エリア */}
      <div
        className="flex-1 flex items-center justify-center px-4 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {photo?.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photo.url}
            alt={photo.label ?? "写真"}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="text-white/50 text-sm">読み込めません</div>
        )}
      </div>

      {/* フッター: メモ + ナビゲーション */}
      <div className="flex-shrink-0 px-4 pb-4 space-y-2">
        {photo?.memo && (
          <p className="text-white/70 text-sm text-center">{photo.memo}</p>
        )}

        {total > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="text-white/80 hover:text-white disabled:text-white/20 min-w-[48px] min-h-[48px] flex items-center justify-center text-xl"
              aria-label="前の写真"
            >
              ‹
            </button>
            {/* ドットインジケーター */}
            <div className="flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/30"
                  }`}
                  aria-label={`写真 ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              disabled={currentIndex === total - 1}
              className="text-white/80 hover:text-white disabled:text-white/20 min-w-[48px] min-h-[48px] flex items-center justify-center text-xl"
              aria-label="次の写真"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
