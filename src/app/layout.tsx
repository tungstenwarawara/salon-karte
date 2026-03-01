import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

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
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
