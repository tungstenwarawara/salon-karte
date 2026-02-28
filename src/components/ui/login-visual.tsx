"use client";

/**
 * ログインページ用ビジュアル要素
 * ボタニカルモチーフのSVGイラスト + 装飾
 */
export function LoginVisual() {
  return (
    <div className="relative flex flex-col items-center">
      {/* 背景の装飾円 */}
      <div className="absolute -top-8 w-48 h-48 rounded-full bg-accent/[0.07] blur-2xl" />
      <div className="absolute top-4 -left-12 w-32 h-32 rounded-full bg-warning/[0.06] blur-xl" />

      {/* ボタニカルSVGイラスト */}
      <svg
        viewBox="0 0 200 160"
        className="w-48 h-auto relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* メインの葉 - 左 */}
        <path
          d="M70 130 Q40 90 60 50 Q70 70 80 90 Q75 60 85 35 Q90 65 90 95 Z"
          fill="var(--color-accent)"
          opacity="0.25"
          className="animate-leaf-sway-left"
        />
        {/* メインの葉 - 右 */}
        <path
          d="M130 130 Q160 90 140 50 Q130 70 120 90 Q125 60 115 35 Q110 65 110 95 Z"
          fill="var(--color-accent)"
          opacity="0.2"
          className="animate-leaf-sway-right"
        />
        {/* 中央の花 */}
        <circle cx="100" cy="75" r="18" fill="var(--color-accent)" opacity="0.15" />
        <circle cx="100" cy="75" r="11" fill="var(--color-accent)" opacity="0.25" />
        <circle cx="100" cy="75" r="5" fill="var(--color-accent)" opacity="0.45" />
        {/* 花弁 */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="100"
            cy="55"
            rx="6"
            ry="14"
            fill="var(--color-accent)"
            opacity="0.12"
            transform={`rotate(${angle} 100 75)`}
          />
        ))}
        {/* アクセントのドット */}
        <circle cx="65" cy="45" r="2.5" fill="var(--color-accent)" opacity="0.3" />
        <circle cx="138" cy="42" r="2" fill="var(--color-accent)" opacity="0.25" />
        <circle cx="50" cy="75" r="1.5" fill="var(--color-warning)" opacity="0.3" />
        <circle cx="152" cy="70" r="1.5" fill="var(--color-warning)" opacity="0.25" />
        {/* 茎 */}
        <path
          d="M100 93 Q100 115 100 140"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          opacity="0.2"
          strokeLinecap="round"
        />
        <path
          d="M100 110 Q85 100 75 105"
          stroke="var(--color-accent)"
          strokeWidth="1"
          opacity="0.15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M100 120 Q115 112 125 116"
          stroke="var(--color-accent)"
          strokeWidth="1"
          opacity="0.15"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* ブランドロゴ */}
      <h1 className="mt-3 text-3xl font-bold tracking-wide text-primary">
        サロンカルテ
      </h1>
      <p className="mt-1.5 text-sm text-text-light tracking-widest">
        あなたのサロンを、もっとスマートに
      </p>
    </div>
  );
}
