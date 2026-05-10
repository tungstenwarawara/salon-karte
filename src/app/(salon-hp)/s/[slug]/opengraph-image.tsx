/**
 * 動的 OGP 画像生成 (1200x630)
 * SNS シェア時、SEI様HPの専用OG画像が表示される
 */
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalonHpContent } from "@/types/database";

export const runtime = "edge";
export const alt = "サロンHP";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

type Params = { slug: string };

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: salon } = await admin
    .from("salons")
    .select("name, hp_content")
    .eq("booking_slug", slug)
    .eq("hp_enabled", true)
    .single();

  const content = salon?.hp_content as SalonHpContent | null;
  const displayName = content?.display_name_override ?? salon?.name ?? "Salon";
  const brandMark = content?.brand?.mark ?? displayName;
  const headline = content?.hero?.headline ?? "";
  const subheadline = content?.hero?.subheadline ?? "";
  const imagePath = content?.hero?.image_path ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#fbfbf9",
          color: "#2a2d2b",
          padding: 80,
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* 背景画像 (薄く) */}
        {imagePath && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${imagePath})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.18,
              display: "flex",
            }}
          />
        )}

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.4em",
              color: "#9B7A52",
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            BUST CARE STUDIO · GINZA
          </div>
          <div
            style={{
              fontSize: 132,
              fontStyle: "italic",
              fontWeight: 300,
              color: "#2a2d2b",
              letterSpacing: "0.04em",
              lineHeight: 1,
              marginBottom: 32,
            }}
          >
            {brandMark}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#2a2d2b",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            {displayName}
          </div>
          {headline && (
            <div
              style={{
                fontSize: 22,
                color: "#6c6f6c",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {headline}
            </div>
          )}
          {subheadline && (
            <div
              style={{
                fontSize: 18,
                color: "#9aa09c",
                letterSpacing: "0.06em",
                maxWidth: 800,
                lineHeight: 1.5,
              }}
            >
              {subheadline}
            </div>
          )}
        </div>

        {/* 装飾線 */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            height: 1,
            background: "#e6e8e3",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 80,
            fontSize: 16,
            letterSpacing: "0.3em",
            color: "#9aa09c",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          salonkarte.com / s / {slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
