import Link from "next/link";
import Image from "next/image";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
  imagePath: string;
  reserve?: {
    eyebrow?: string;
    headline?: string;
    lead?: string;
    primary_label?: string;
    secondary_label?: string;
    secondary_url?: string | null;
  };
};

/** Claude Design: 全画面写真 + 暗オーバーレイ + 大セリフ見出し + 2ボタン */
export function HpReserve({
  bookingSlug,
  bookingEnabled,
  imagePath,
  reserve,
}: Props) {
  const headline = reserve?.headline ?? "Begin your white hour.";
  const lead = reserve?.lead ?? "白い扉を開けて、自分のための時間を。";

  return (
    <section
      id="reserve"
      className="relative px-[5vw] py-32 md:py-[160px] text-center text-white sei-dark-section overflow-hidden"
    >
      {/* 背景画像 (Next.js Image で最適化) */}
      <Image
        src={imagePath}
        alt=""
        fill
        sizes="100vw"
        className="object-cover -z-10"
        loading="lazy"
      />
      {/* 暗オーバーレイ */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: "rgba(20,18,15,0.55)" }}
      />
      <span className="head-en reveal text-white/85 block">
        {reserve?.eyebrow ?? "RESERVATION"}
      </span>
      <h2
        className="reveal font-serif-en italic font-light leading-none mt-6 mb-3"
        style={{ fontSize: "clamp(48px, 7vw, 110px)" }}
      >
        {headline}
      </h2>
      <p className="reveal font-serif-jp text-[13px] tracking-[0.4em] opacity-85 mb-14 mt-0">
        {lead}
      </p>

      <div className="reveal inline-flex flex-wrap justify-center gap-4">
        {bookingEnabled && bookingSlug && (
          <Link
            href={`/book/${bookingSlug}`}
            className="reserve-btn-primary inline-flex items-center gap-3.5 px-12 py-5 min-w-[240px] font-sans-en text-[11px] tracking-[0.4em] uppercase transition-all duration-300"
            style={{
              border: "1px solid #fff",
              background: "#fff",
              color: "#2a2d2b",
            }}
          >
            {reserve?.primary_label ?? "Online Booking"}
            <span className="font-serif-en italic text-base tracking-normal">→</span>
          </Link>
        )}
        {reserve?.secondary_url && (
          <a
            href={reserve.secondary_url}
            target="_blank"
            rel="noopener noreferrer"
            className="reserve-btn-secondary inline-flex items-center gap-3.5 px-12 py-5 min-w-[240px] font-sans-en text-[11px] tracking-[0.4em] uppercase transition-all duration-300"
            style={{
              border: "1px solid #fff",
              color: "#fff",
            }}
          >
            {reserve.secondary_label ?? "LINEで予約"}
            <span className="font-serif-en italic text-base tracking-normal">→</span>
          </a>
        )}
      </div>
      <style>{`
        .reserve-btn-primary:hover { background: transparent !important; color: #fff !important; }
        .reserve-btn-secondary:hover { background: #fff !important; color: #2a2d2b !important; }
      `}</style>
    </section>
  );
}
