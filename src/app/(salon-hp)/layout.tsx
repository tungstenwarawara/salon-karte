import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function SalonHpLayout({ children }: { children: React.ReactNode }) {
  // NANA 系: 白でなくクリーム基調・余白多め・落ち着いた質感
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-gray-800 antialiased salon-hp-root">
      {children}
    </div>
  );
}
