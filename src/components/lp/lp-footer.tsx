/** LPフッター */

import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export function LpFooter() {
  return (
    <footer className="bg-[#3D3D3D] text-white/80 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* ロゴ + 説明 */}
          <div className="text-center md:text-left">
            <BrandLogo size="sm" className="mx-auto md:mx-0 [&_*]:!stroke-white/80" />
            <p className="text-sm text-white/50 mt-2">
              個人サロンのための、やさしいサロン管理アプリ
            </p>
          </div>

          {/* リンク */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/tokusho" className="hover:text-white transition-colors">
              特定商取引法に基づく表記
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Salon Karte. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
