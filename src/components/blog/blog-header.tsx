/** ブログ共通ヘッダー — LP と同じブランドデザイン */

import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export function BlogHeader() {
  return (
    <header className="border-b border-border/50 bg-white/90 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="トップページ">
            <BrandLogo size="sm" />
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-text-light hover:text-accent transition-colors hidden sm:block"
          >
            ブログ
          </Link>
        </div>
        <Link
          href="/signup"
          className="bg-accent hover:bg-accent-light text-white text-sm font-bold rounded-xl px-5 py-2 transition-colors min-h-[44px] flex items-center"
        >
          無料ではじめる
        </Link>
      </div>
    </header>
  );
}
