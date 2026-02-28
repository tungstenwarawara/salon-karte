/**
 * 空状態用SVGイラスト（6種）
 * サロンの雰囲気に合うミニマルなラインアート
 * stroke="currentColor" で親の text-* クラスから色を継承
 */

type IllustrationProps = {
  className?: string;
};

/** 人物シルエット — 顧客一覧、スタッフ管理 */
function CustomerIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 14c1.5 1 2.5 3 1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** ペン+ノート — カルテ、施術履歴、回数券、写真 */
function RecordIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <rect x="13" y="10" width="18" height="24" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="17" y1="17" x2="27" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="17" y1="21" x2="25" y2="21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="17" y1="25" x2="23" y2="25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <path d="M29 28l6-6 3 3-6 6-3.5.5.5-3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** カレンダー — 予約・スケジュール系（予備） */
function CalendarIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <rect x="11" y="13" width="26" height="22" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="11" y1="19" x2="37" y2="19" stroke="currentColor" strokeWidth="1.8" />
      <line x1="18" y1="10" x2="18" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="30" y1="10" x2="30" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19" cy="25" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="25" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="29" cy="25" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="19" cy="30" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="30" r="1.2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** ショッピングバッグ — 物販、在庫、商品、棚卸し */
function ProductIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <path d="M14 18h20l-2 18H16L14 18z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M18 18v-3a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 26c1.5 2 6.5 2 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** 棒グラフ — 売上、ランキング */
function ChartIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <rect x="13" y="26" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="21.5" y="18" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="30" y="22" width="5" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 14l8 4 8-6 8 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <circle cx="36" cy="14" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** クリップボード+チェック — テンプレート、設定、カウンセリング */
function ClipboardIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <rect x="13" y="12" width="22" height="26" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="19" y="9" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 22l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="19" y1="31" x2="29" y2="31" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// --- 公開コンポーネント ---

export type IllustrationType = "customer" | "record" | "calendar" | "product" | "chart" | "clipboard";

const illustrations: Record<IllustrationType, React.FC<IllustrationProps>> = {
  customer: CustomerIllustration,
  record: RecordIllustration,
  calendar: CalendarIllustration,
  product: ProductIllustration,
  chart: ChartIllustration,
  clipboard: ClipboardIllustration,
};

type Props = {
  type: IllustrationType;
  size?: "sm" | "md";
};

/** イラスト表示コンポーネント（EmptyStateから呼ばれる） */
export function EmptyStateIllustration({ type, size = "sm" }: Props) {
  const Component = illustrations[type];
  const sizeClass = size === "md" ? "w-16 h-16" : "w-12 h-12";

  return (
    <div className={`${sizeClass} mx-auto mb-3 text-accent`}>
      <Component className="w-full h-full" />
    </div>
  );
}
