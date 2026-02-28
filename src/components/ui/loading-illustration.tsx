/**
 * ローディング中イラスト表示コンポーネント
 * ページ読み込み中にGemini生成SVGイラストをアニメーション表示する
 * スケルトンの上部に配置し、待ち時間を温かみのある体験に変える
 */
import { EmptyStateIllustration, type IllustrationType } from "./empty-state-illustrations";

type Props = {
  /** イラスト種類 */
  type: IllustrationType;
  /** ローディングテキスト（デフォルト: "読み込み中..."） */
  label?: string;
  /** スケルトン部（children） */
  children?: React.ReactNode;
};

export function LoadingIllustration({ type, label = "読み込み中...", children }: Props) {
  return (
    <div className="space-y-4">
      {/* イラスト + テキスト */}
      <div className="flex flex-col items-center pt-4 pb-2 animate-fade-in-up">
        <div className="loading-pulse">
          <EmptyStateIllustration type={type} size="sm" />
        </div>
        <p className="text-text-light text-xs loading-pulse-text">{label}</p>
      </div>
      {/* スケルトン部 */}
      {children && (
        <div className="opacity-40">
          {children}
        </div>
      )}
    </div>
  );
}
