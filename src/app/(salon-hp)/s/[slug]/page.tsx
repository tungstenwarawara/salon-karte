import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalonHpContent } from "@/types/database";
import { HpCornerUi } from "@/components/salon-hp/hp-corner-ui";
import { HpRevealController } from "@/components/salon-hp/hp-reveal";
import { HpHero } from "@/components/salon-hp/hp-hero";
import { HpMarquee } from "@/components/salon-hp/hp-marquee";
import { HpWhySei } from "@/components/salon-hp/hp-why-sei";
import { HpMoment } from "@/components/salon-hp/hp-moment";
import { HpConcept } from "@/components/salon-hp/hp-concept";
import { HpMenu } from "@/components/salon-hp/hp-menu";
import { HpJourney } from "@/components/salon-hp/hp-journey";
import { HpTherapist } from "@/components/salon-hp/hp-therapist";
import { HpVoice } from "@/components/salon-hp/hp-voice";
import { HpReserve } from "@/components/salon-hp/hp-reserve";
import { HpAccess } from "@/components/salon-hp/hp-access";
import { HpFaq } from "@/components/salon-hp/hp-faq";
import { HpFooter } from "@/components/salon-hp/hp-footer";
import type { BusinessHours } from "@/types/database";

const DAY_SCHEMA: Record<keyof BusinessHours, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

/** BeautySalon JSON-LD 拡充版 (営業時間 / メニュー / レビュー / 価格範囲) */
function buildBeautySalonJsonLd(args: {
  displayName: string;
  displayAddress: string | null;
  displayPhone: string | null;
  displayBusinessHours: BusinessHours | null;
  content: SalonHpContent;
  menus: { name: string; price: number; duration_minutes: number }[];
  slug: string;
}) {
  const { displayName, displayAddress, displayPhone, displayBusinessHours, content, menus, slug } = args;

  // 営業時間 → schema.org openingHoursSpecification
  const openingHoursSpecification = displayBusinessHours
    ? Object.entries(displayBusinessHours)
        .filter(([, day]) => day.is_open)
        .map(([key, day]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: DAY_SCHEMA[key as keyof BusinessHours],
          opens: day.open_time,
          closes: day.close_time,
        }))
    : undefined;

  // メニュー → schema.org makesOffer (Service)
  const makesOffer = menus.length > 0
    ? menus.map((m) => ({
        "@type": "Offer",
        priceCurrency: "JPY",
        price: String(m.price),
        itemOffered: {
          "@type": "Service",
          name: m.name,
        },
      }))
    : undefined;

  // 価格範囲
  const prices = menus.map((m) => m.price).filter((p) => p > 0);
  const priceRange = prices.length > 0
    ? `¥${Math.min(...prices).toLocaleString()} - ¥${Math.max(...prices).toLocaleString()}`
    : undefined;

  // レビュー集計
  const aggregateRating = content.testimonials?.hotpepper_rating
    ? {
        "@type": "AggregateRating",
        ratingValue: content.testimonials.hotpepper_rating,
        reviewCount: content.testimonials.hotpepper_review_count ?? content.testimonials.items.length,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined;

  // SNS / 外部リンク
  const sameAs = [
    content.links.instagram,
    content.links.line_url,
    content.links.website,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: displayName,
    description: content.hero.subheadline,
    url: `https://salonkarte.com/s/${slug}`,
    image: content.hero.image_path || undefined,
    address: displayAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: displayAddress,
          addressLocality: "中央区",
          addressRegion: "東京都",
          addressCountry: "JP",
        }
      : undefined,
    telephone: displayPhone || undefined,
    priceRange,
    openingHoursSpecification,
    makesOffer,
    aggregateRating,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

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
  if (!data) return { title: "サロンが見つかりません", robots: { index: false } };

  const content = data.salon.hp_content as SalonHpContent;
  const displayName = content.display_name_override ?? data.salon.name;
  const url = `https://salonkarte.com/s/${slug}`;
  const title = `${displayName} | ${content.hero.headline}`;
  const description = content.hero.subheadline;

  return {
    title,
    description,
    metadataBase: new URL("https://salonkarte.com"),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "ja_JP",
      siteName: displayName,
      // Next.js が opengraph-image.tsx を自動的に og:image としてリンクする
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // Next.js が opengraph-image.tsx を twitter:image にも自動リンク
    },
  };
}

export default async function SalonHpPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSalonData(slug);
  if (!data) notFound();

  const { salon, menus } = data;
  const content = salon.hp_content as SalonHpContent;

  // overrides
  const displayName = content.display_name_override ?? salon.name;
  const displayAddress = content.address_override ?? salon.address;
  const displayPhone = content.phone_override !== undefined ? content.phone_override : salon.phone;
  const displayBusinessHours = content.business_hours_override ?? salon.business_hours;
  const displayMenus = content.menu_override ?? menus;

  // brand
  const brandMark = content.brand?.mark ?? displayName;
  const brandSub = content.brand?.sub ?? "Bust care studio";
  const brandSummary = content.brand?.summary;

  // reserve image fallback to hero image
  const reserveImage = content.reserve?.image_path ?? content.hero.image_path ?? "";

  return (
    <>
      <HpRevealController />
      <HpCornerUi
        brandMark={brandMark}
        brandSub={brandSub}
        bookingSlug={salon.booking_slug}
        bookingEnabled={salon.booking_enabled}
      />

      <main>
        {/* 01. Hero */}
        <HpHero hero={content.hero} brandMark={brandMark} salonName={displayName} />

        {/* 02. Marquee */}
        {content.marquee && content.marquee.items.length > 0 && (
          <HpMarquee items={content.marquee.items} />
        )}

        {/* 03. Why SEI */}
        {content.why_sei && content.why_sei.items.length > 0 && (
          <HpWhySei whySei={content.why_sei} />
        )}

        {/* 04. Moment */}
        {content.moment && <HpMoment moment={content.moment} />}

        {/* 05. Concept */}
        {content.concept.paragraphs && content.concept.image_path && (
          <section id="concept">
            <HpConcept
              concept={{
                eyebrow: content.concept.eyebrow,
                paragraphs: content.concept.paragraphs,
                image_path: content.concept.image_path,
              }}
              salonName={displayName}
            />
          </section>
        )}

        {/* 06. Menu */}
        <section id="menu">
          <HpMenu menus={displayMenus} />
        </section>

        {/* 07. Journey */}
        {content.journey && content.journey.items.length > 0 && (
          <section id="journey">
            <HpJourney journey={content.journey} />
          </section>
        )}

        {/* 08. Therapist */}
        {content.about.name_en && content.about.owner_image_path && (
          <HpTherapist
            therapist={{
              eyebrow: "THERAPIST",
              name_en: content.about.name_en,
              role: content.about.role ?? content.about.owner_title,
              description: content.about.story ?? content.about.description,
              image_path: content.about.owner_image_path,
              career: content.about.career,
              license: content.about.license,
              specialty: content.about.specialty,
            }}
          />
        )}

        {/* 09. Voice */}
        <section id="voice">
          <HpVoice testimonials={content.testimonials} />
        </section>

        {/* 10. Access */}
        <section id="access">
          <HpAccess
            access={content.access}
            salonName={displayName}
            address={displayAddress}
            phone={displayPhone}
            businessHours={displayBusinessHours}
          />
        </section>

        {/* 11. FAQ */}
        <section id="faq">
          <HpFaq faq={content.faq} salonName={displayName} />
        </section>

        {/* 12. Reserve (closing CTA) */}
        {reserveImage && (
          <HpReserve
            bookingSlug={salon.booking_slug}
            bookingEnabled={salon.booking_enabled}
            imagePath={reserveImage}
            reserve={content.reserve}
          />
        )}
      </main>

      <HpFooter
        salonName={displayName}
        brandMark={brandMark}
        brandSummary={brandSummary}
        links={content.links}
      />

      {/* JSON-LD LocalBusiness (BeautySalon) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBeautySalonJsonLd({
              displayName,
              displayAddress,
              displayPhone,
              displayBusinessHours,
              content,
              menus: displayMenus,
              slug,
            })
          ),
        }}
      />

      {/* JSON-LD BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Salon Karte",
                item: "https://salonkarte.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: displayName,
                item: `https://salonkarte.com/s/${slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
