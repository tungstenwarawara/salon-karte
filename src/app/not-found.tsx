import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <p className="text-6xl font-bold text-accent">404</p>
        <h1 className="text-xl font-bold">
          ページが見つかりませんでした
        </h1>
        <p className="text-text-light text-sm">
          お探しのページは移動または削除された可能性があります。
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/dashboard"
            className="bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 min-h-[48px] transition-colors inline-flex items-center justify-center"
          >
            ダッシュボードに戻る
          </Link>
          <Link
            href="/"
            className="text-sm text-accent hover:underline"
          >
            トップページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
