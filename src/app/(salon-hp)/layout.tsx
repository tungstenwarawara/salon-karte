import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Shippori_Mincho, Noto_Serif_JP } from "next/font/google";
import "./styles.css";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
});

const jost = Jost({
  weight: ["300", "400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

const shippori = Shippori_Mincho({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori",
});

const notoSerifJp = Noto_Serif_JP({
  weight: ["300", "400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif-jp",
});

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function SalonHpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`salon-hp-root font-serif-jp ${cormorant.variable} ${jost.variable} ${shippori.variable} ${notoSerifJp.variable}`}
    >
      {children}
    </div>
  );
}
