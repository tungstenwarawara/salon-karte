import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
  description:
    "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・会計ソフト連携が月額2,980円。初期費用0円、スマホだけでOK。",
  keywords: [
    "サロン管理",
    "電子カルテ",
    "予約管理",
    "個人サロン",
    "美容室",
    "エステサロン",
    "ネイルサロン",
    "LINE連携",
    "会計ソフト連携",
    "顧客管理",
  ],
  openGraph: {
    title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
    description:
      "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・会計ソフト連携が月額2,980円。",
    type: "website",
    locale: "ja_JP",
    siteName: "Salon Karte",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
    description:
      "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・会計ソフト連携が月額2,980円。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale は削除（アクセシビリティ：視覚障害ユーザーがズームできるように）
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
