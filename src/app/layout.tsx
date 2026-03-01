import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export const metadata: Metadata = {
  title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
  description:
    "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・確定申告サポートが月額2,980円。初期費用0円、スマホだけでOK。",
  keywords: [
    "サロン管理",
    "電子カルテ",
    "予約管理",
    "個人サロン",
    "美容室",
    "エステサロン",
    "ネイルサロン",
    "LINE連携",
    "確定申告",
    "顧客管理",
  ],
  openGraph: {
    title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
    description:
      "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・確定申告サポートが月額2,980円。",
    type: "website",
    locale: "ja_JP",
    siteName: "Salon Karte",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。",
    description:
      "個人サロン向けのカルテ管理・予約管理・LINE連携・売上分析・確定申告サポートが月額2,980円。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {GA4_ID && (
        <head>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `}
          </Script>
        </head>
      )}
      <body className="antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
