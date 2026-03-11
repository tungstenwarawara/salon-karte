import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalonHpContent } from "@/types/database";
import { HpHeader } from "@/components/salon-hp/hp-header";
import { HpHero } from "@/components/salon-hp/hp-hero";
import { HpAbout } from "@/components/salon-hp/hp-about";
import { HpConcept } from "@/components/salon-hp/hp-concept";
import { HpMenu } from "@/components/salon-hp/hp-menu";
import { HpFlow } from "@/components/salon-hp/hp-flow";
import { HpGallery } from "@/components/salon-hp/hp-gallery";
import { HpTestimonials } from "@/components/salon-hp/hp-testimonials";
import { HpAccess } from "@/components/salon-hp/hp-access";
import { HpFaq } from "@/components/salon-hp/hp-faq";
import { HpBookingCta } from "@/components/salon-hp/hp-booking-cta";
import { HpFooter } from "@/components/salon-hp/hp-footer";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getSalonData(slug: string) {
  const admin = createAdminClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id, name, phone, address, business_hours, salon_holidays, booking_slug, booking_enabled, hp_enabled, hp_content")
    .eq("booking_slug", slug)
    .eq("hp_enabled", true)
    .single();

  if (!salon || !salon.hp_content) return null;

  // アクティブなメニュー取得
  const { data: menus } = await admin
    .from("treatment_menus")
    .select("id, name, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  return { salon, menus: menus ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSalonData(slug);
  if (!data) return { title: "サロンが見つかりません" };

  const content = data.salon.hp_content as SalonHpContent;
  return {
    title: `${data.salon.name} | ${content.hero.headline}`,
    description: content.hero.subheadline,
    openGraph: {
      title: `${data.salon.name} | ${content.hero.headline}`,
      description: content.hero.subheadline,
      type: "website",
    },
  };
}

export default async function SalonHpPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSalonData(slug);
  if (!data) notFound();

  const { salon, menus } = data;
  const content = salon.hp_content as SalonHpContent;

  return (
    <>
      <HpHeader
        salonName={salon.name}
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />
      <HpHero
        hero={content.hero}
        salonName={salon.name}
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />
      <HpAbout about={content.about} />
      <HpConcept concept={content.concept} />
      <HpMenu menus={menus} />
      <HpFlow flow={content.flow} />
      {content.gallery.images.length > 0 && <HpGallery gallery={content.gallery} />}
      <HpTestimonials testimonials={content.testimonials} />
      <HpAccess
        access={content.access}
        salonName={salon.name}
        address={salon.address}
        phone={salon.phone}
        businessHours={salon.business_hours}
      />
      <HpFaq faq={content.faq} salonName={salon.name} />
      <HpBookingCta
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
        salonName={salon.name}
      />
      <HpFooter salonName={salon.name} links={content.links} />

      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: salon.name,
            address: salon.address ? {
              "@type": "PostalAddress",
              streetAddress: salon.address,
              addressLocality: "東京都",
              addressCountry: "JP",
            } : undefined,
            telephone: salon.phone || undefined,
            url: `https://salonkarte.com/s/${slug}`,
          }),
        }}
      />
    </>
  );
}
