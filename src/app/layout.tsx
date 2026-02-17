import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サロンカルテ - エステサロン向けカルテ管理",
  description:
    "個人エステサロン向けのシンプルなカルテ管理システム。顧客管理、施術記録、写真管理をスマホで簡単に。",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
