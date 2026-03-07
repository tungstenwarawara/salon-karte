import Link from "next/link";
import { GuideNavigation } from "@/components/guide/guide-navigation";
import { GuideHeroSection } from "@/components/guide/guide-hero-section";
import { GuideDailyFlow } from "@/components/guide/guide-daily-flow";
import { GuideSetupSteps } from "@/components/guide/guide-setup-steps";
import { GuideFeatureGrid } from "@/components/guide/guide-feature-grid";
import { GuideSecuritySection } from "@/components/guide/guide-security-section";
import { GuideFaqSection } from "@/components/guide/guide-faq-section";
import { GuidePricingSection } from "@/components/guide/guide-pricing-section";


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

      {/* サポートCTA */}
      <div className="bg-gradient-to-br from-accent/5 to-[#E4A89E]/5 border border-accent/15 rounded-2xl p-6 text-center">
        <p className="text-sm font-medium">
          ご不明な点やご要望がありましたら
          <br />
          お気軽にご連絡ください
        </p>
        <a
          href="mailto:support@salonkarte.com"
          className="inline-flex items-center justify-center gap-2 mt-4 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors text-sm min-h-[48px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          サポートに連絡する
        </a>
      </div>
    </div>
  );
}
