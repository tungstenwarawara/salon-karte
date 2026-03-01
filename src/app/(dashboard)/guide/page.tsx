import Link from "next/link";
import { GuideNavigation } from "@/components/guide/guide-navigation";
import { GuideHeroSection } from "@/components/guide/guide-hero-section";
import { GuideDailyFlow } from "@/components/guide/guide-daily-flow";
import { GuideSetupSteps } from "@/components/guide/guide-setup-steps";
import { GuideFeatureGrid } from "@/components/guide/guide-feature-grid";
import { GuideSecuritySection } from "@/components/guide/guide-security-section";
import { GuideFaqSection } from "@/components/guide/guide-faq-section";
import { GuidePricingSection } from "@/components/guide/guide-pricing-section";
import { GuideFutureFeatures } from "@/components/guide/guide-future-features";

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <div id={id} className="scroll-mt-20">
      <h3 className="font-bold text-base">{title}</h3>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-10">
      {/* ページヘッダー */}
      <div>
        <h2 className="text-xl font-bold">使い方ガイド</h2>
        <p className="text-text-light text-sm mt-1">
          サロンカルテの基本的な使い方をご紹介します
        </p>

        {/* セクションナビゲーション */}
        <div className="mt-4">
          <GuideNavigation />
        </div>
      </div>

      {/* できること概要 */}
      <GuideHeroSection />

      {/* 1日の使い方 */}
      <GuideDailyFlow />

      {/* 初期設定 */}
      <GuideSetupSteps />

      {/* 機能一覧 */}
      <GuideFeatureGrid />

      {/* セキュリティ */}
      <GuideSecuritySection />

      {/* よくある質問 */}
      <div id="faq" className="scroll-mt-20">
        <h3 className="font-bold text-base mb-4">よくある質問</h3>
        <GuideFaqSection />
      </div>

      {/* 料金プラン */}
      <div id="pricing" className="scroll-mt-20">
        <h3 className="font-bold text-base mb-4">料金プラン</h3>
        <GuidePricingSection />
      </div>

      {/* 今後追加予定の機能 */}
      <div>
        <h3 className="font-bold text-base mb-4">今後追加予定の機能</h3>
        <GuideFutureFeatures />
      </div>

      {/* サポートCTA */}
      <div className="bg-gradient-to-br from-accent/5 to-[#E4A89E]/5 border border-accent/15 rounded-2xl p-6 text-center">
        <p className="text-sm font-medium">
          ご不明な点やご要望がありましたら
          <br />
          お気軽にご連絡ください
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors text-sm min-h-[48px]"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
