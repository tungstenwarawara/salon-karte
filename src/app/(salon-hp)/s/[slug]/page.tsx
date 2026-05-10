import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalonHpContent } from "@/types/database";
import { HpHeader } from "@/components/salon-hp/hp-header";
import { HpHero } from "@/components/salon-hp/hp-hero";
import { HpAbout } from "@/components/salon-hp/hp-about";
import { HpBeforeAfter } from "@/components/salon-hp/hp-before-after";
import { HpConcept } from "@/components/salon-hp/hp-concept";
import { HpMenu } from "@/components/salon-hp/hp-menu";
import { HpFlow } from "@/components/salon-hp/hp-flow";
import { HpGallery } from "@/components/salon-hp/hp-gallery";
import { HpTestimonials } from "@/components/salon-hp/hp-testimonials";
import { HpInstagram } from "@/components/salon-hp/hp-instagram";
import { HpAccess } from "@/components/salon-hp/hp-access";
import { HpFaq } from "@/components/salon-hp/hp-faq";
import { HpBookingCta } from "@/components/salon-hp/hp-booking-cta";
import { HpFooter } from "@/components/salon-hp/hp-footer";
import { HpConcerns } from "@/components/salon-hp/hp-concerns";
import { HpInlineCta } from "@/components/salon-hp/hp-inline-cta";
import { HpPricing } from "@/components/salon-hp/hp-pricing";
import { HpStickyCta } from "@/components/salon-hp/hp-sticky-cta";

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
  const displayName = content.display_name_override ?? data.salon.name;
  return {
    title: `${displayName} | ${content.hero.headline}`,
    description: content.hero.subheadline,
    openGraph: {
      title: `${displayName} | ${content.hero.headline}`,
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

  // hp_content に override があれば優先（test→本番移植まで test salon 上で SEI 様情報を表示するため）
  const displayName = content.display_name_override ?? salon.name;
  const displayAddress = content.address_override ?? salon.address;
  const displayPhone = content.phone_override !== undefined ? content.phone_override : salon.phone;
  const displayBusinessHours = content.business_hours_override ?? salon.business_hours;
  const displayMenus = content.menu_override ?? menus;

  return (
    <>
      <HpHeader
        salonName={displayName}
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />
      <HpHero
        hero={content.hero}
        salonName={displayName}
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />
      {content.concerns && content.concerns.items.length > 0 && (
        <HpConcerns concerns={content.concerns} />
      )}
      <HpAbout about={content.about} />
      {content.before_after && content.before_after.items.length > 0 && (
        <HpBeforeAfter beforeAfter={content.before_after} />
      )}
      <HpInlineCta bookingSlug={salon.booking_slug} bookingEnabled={salon.booking_enabled} />
      <HpConcept concept={content.concept} />
      <HpMenu menus={displayMenus} />
      {content.pricing ? (
        <HpPricing
          pricing={content.pricing}
          bookingSlug={salon.booking_slug}
          bookingEnabled={salon.booking_enabled}
        />
      ) : (
        <HpInlineCta bookingSlug={salon.booking_slug} bookingEnabled={salon.booking_enabled} />
      )}
      <HpFlow flow={content.flow} />
      {content.gallery.images.length > 0 && <HpGallery gallery={content.gallery} />}
      <HpTestimonials testimonials={content.testimonials} />
      <HpInlineCta bookingSlug={salon.booking_slug} bookingEnabled={salon.booking_enabled} />
      <HpInstagram instagram={content.links.instagram} salonName={displayName} />
      <HpAccess
        access={content.access}
        salonName={displayName}
        address={displayAddress}
        phone={displayPhone}
        businessHours={displayBusinessHours}
      />
      <HpFaq faq={content.faq} salonName={displayName} />
      <HpBookingCta
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
        salonName={displayName}
      />
      <HpFooter salonName={displayName} links={content.links} />
      <HpStickyCta
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />

      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: displayName,
            address: displayAddress ? {
              "@type": "PostalAddress",
              streetAddress: displayAddress,
              addressLocality: "東京都",
              addressCountry: "JP",
            } : undefined,
            telephone: displayPhone || undefined,
            url: `https://salonkarte.com/s/${slug}`,
          }),
        }}
      />
    </>
  );
}
