import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LpHeader } from "@/components/lp/lp-header";
import { HeroSection } from "@/components/lp/hero-section";
import { ProblemSection } from "@/components/lp/problem-section";
import { FeaturesSection } from "@/components/lp/features-section";
import { AppShowcaseSection } from "@/components/lp/app-showcase-section";
import { PricingSection } from "@/components/lp/pricing-section";
import { ComparisonSection } from "@/components/lp/comparison-section";
import { StepsSection } from "@/components/lp/steps-section";
import { FaqSection } from "@/components/lp/faq-section";
import { FinalCtaSection } from "@/components/lp/final-cta-section";
import { LpFooter } from "@/components/lp/lp-footer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      {/* JSON-LD 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Salon Karte（サロンカルテ）",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・確定申告サポートが月額2,980円で利用できるサロン管理アプリ",
              offers: {
                "@type": "Offer",
                price: "2980",
                priceCurrency: "JPY",
                priceValidUntil: "2027-12-31",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Salon Karte",
              url: "https://salonkarte.com",
            },
          ]),
        }}
      />

      <LpHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <AppShowcaseSection />
        <PricingSection />
        <ComparisonSection />
        <StepsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LpFooter />
    </>
  );
}
