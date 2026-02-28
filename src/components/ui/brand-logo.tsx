/**
 * ブランドロゴ SVG コンポーネント
 * カルテアイコン + パス化テキスト "Salon Karte"
 * - sm: ヘッダー用（高さ24px）
 * - lg: ログイン画面用（高さ48px）
 */

type Props = {
  size?: "sm" | "lg";
  className?: string;
};

/** アイコン + テキストパス（共通パーツ） */
function LogoContent() {
  return (
    <>
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* カルテアイコン */}
        <rect x={4} y={4} width={14} height={16} rx={2} fill="none" stroke="#C4956A" strokeWidth={1.2} />
        <path d="M 8 4 V 3 C 8 2 9 1 11 1 C 13 1 14 2 14 3 V 4" fill="none" stroke="#8B7B6B" strokeWidth={1.2} />
        <rect x={7} y={3} width={8} height={2} rx={0.5} fill="#8B7B6B" />
        {/* カルテの線 */}
        <line x1={8} y1={9} x2={14} y2={9} stroke="#8B7B6B" strokeWidth={1} opacity={0.5} />
        <line x1={8} y1={13} x2={14} y2={13} stroke="#8B7B6B" strokeWidth={1} opacity={0.5} />
        <line x1={8} y1={17} x2={12} y2={17} stroke="#8B7B6B" strokeWidth={1} opacity={0.5} />
        {/* キラキラ装飾 */}
        <path d="M 18 1 Q 18 4 21 4 Q 18 4 18 7 Q 18 4 15 4 Q 18 4 18 1 Z" fill="#C4956A" />
      </g>
      {/* テキスト "Salon Karte" パス化 */}
      <g stroke="#8B7B6B" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* S */}
        <path d="M 33 9 C 28 6 28 12 30.5 12 C 33 12 33 18 28 15" />
        {/* a */}
        <path d="M 43 17 V 11 M 43 14 A 3 3 0 1 1 37 14 A 3 3 0 1 1 43 14" />
        {/* l */}
        <path d="M 47 7 V 17" />
        {/* o */}
        <path d="M 55 14 A 3 3 0 1 1 49 14 A 3 3 0 1 1 55 14" />
        {/* n */}
        <path d="M 59 17 V 11 M 59 13 C 59 11 65 11 65 13 V 17" />
        {/* K */}
        <path d="M 73 7 V 17 M 79 7 L 73 12 L 79 17" />
        {/* a */}
        <path d="M 87 17 V 11 M 87 14 A 3 3 0 1 1 81 14 A 3 3 0 1 1 87 14" />
        {/* r */}
        <path d="M 91 17 V 11 M 91 13 C 91 11 95 11 95 11" />
        {/* t */}
        <path d="M 98 8 V 15.5 A 1.5 1.5 0 0 0 99.5 17 H 101 M 96 11 H 101" />
        {/* e */}
        <path d="M 103 14 H 109 C 109 11 103 11 103 14 C 103 17 109 17 109 15.5" />
      </g>
    </>
  );
}

export function BrandLogo({ size = "sm", className = "" }: Props) {
  if (size === "lg") {
    return (
      <svg
        viewBox="0 0 240 48"
        width={240}
        height={48}
        className={className}
        aria-label="Salon Karte"
        role="img"
      >
        <g transform="scale(2)">
          <LogoContent />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 24"
      width={120}
      height={24}
      className={className}
      aria-label="Salon Karte"
      role="img"
    >
      <LogoContent />
    </svg>
  );
}
