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
        <HpHero hero={content.hero} brandMark={brandMark} />

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

      {/* JSON-LD LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: displayName,
            address: displayAddress
              ? {
                  "@type": "PostalAddress",
                  streetAddress: displayAddress,
                  addressLocality: "東京都",
                  addressCountry: "JP",
                }
              : undefined,
            telephone: displayPhone || undefined,
            url: `https://salonkarte.com/s/${slug}`,
          }),
        }}
      />
    </>
  );
}
