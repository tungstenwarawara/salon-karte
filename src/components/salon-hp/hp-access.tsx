import type { SalonHpContent, BusinessHours } from "@/types/database";

type Props = {
  access: SalonHpContent["access"];
  salonName: string;
  address: string | null;
  phone: string | null;
  businessHours: BusinessHours | null;
};

const DAY_LABELS: { key: keyof BusinessHours; label: string }[] = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

/** Claude Design 系の Access (NANA に倣い、編集的レイアウト) */
export function HpAccess({ access, salonName, address, phone, businessHours }: Props) {
  return (
    <section className="px-[5vw] py-24 md:py-[120px] bg-[color:var(--bg)]">
      <div className="text-center mb-16 md:mb-20">
        <span className="head-en reveal block">ACCESS</span>
        <h2
          className="reveal font-serif-en italic font-light mt-6 leading-none"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          Find us.
        </h2>
        <p className="reveal font-serif-jp text-xs tracking-[0.4em] text-[color:var(--ink-mute)] mt-5">
          — 銀座、白い扉のある場所
        </p>
      </div>

      <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {/* 左: 詳細 */}
        <div className="reveal">
          <dl
            className="grid text-sm tracking-[0.08em]"
            style={{ gridTemplateColumns: "100px 1fr", rowGap: "20px", columnGap: "24px" }}
          >
            <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
              Salon
            </dt>
            <dd className="m-0 font-serif-jp text-[color:var(--ink)] leading-[1.9]">{salonName}</dd>

            {address && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Address
                </dt>
                <dd className="m-0 text-[color:var(--ink-soft)] leading-[1.9]">{address}</dd>
              </>
            )}

            {access.station && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Station
                </dt>
                <dd className="m-0 text-[color:var(--ink-soft)] leading-[1.9]">{access.station}</dd>
              </>
            )}

            {phone && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Tel
                </dt>
                <dd className="m-0">
                  <a
                    href={`tel:${phone}`}
                    className="text-[color:var(--ink-soft)] hover:text-[color:var(--accent)] transition-colors leading-[1.9]"
                  >
                    {phone}
                  </a>
                </dd>
              </>
            )}

            {access.details && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Note
                </dt>
                <dd className="m-0 text-[12px] text-[color:var(--ink-soft)] leading-[1.9] whitespace-pre-line">
                  {access.details}
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* 右: Hours */}
        <div className="reveal">
          {businessHours && (
            <>
              <span className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase block mb-6">
                Hours
              </span>
              <ul className="space-y-3">
                {DAY_LABELS.map(({ key, label }) => {
                  const day = businessHours[key];
                  return (
                    <li
                      key={key}
                      className="flex items-baseline justify-between border-b border-[color:var(--line)] pb-2 text-sm tracking-wider"
                    >
                      <span
                        className={`font-sans-en text-[11px] tracking-[0.25em] uppercase ${
                          day.is_open ? "text-[color:var(--ink-soft)]" : "text-[color:var(--ink-mute)]/50"
                        }`}
                      >
                        {label}
                      </span>
                      {day.is_open ? (
                        <span className="font-serif-en text-base tabular-nums text-[color:var(--ink)]">
                          {day.open_time} — {day.close_time}
                        </span>
                      ) : (
                        <span className="font-serif-en italic text-xs text-[color:var(--ink-mute)]">
                          Closed
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Google Map */}
      {access.google_maps_embed_url && (
        <div className="reveal max-w-[1180px] mx-auto mt-14 md:mt-16 overflow-hidden border border-[color:var(--line)]">
          <iframe
            src={access.google_maps_embed_url}
            width="100%"
            height="360"
            style={{ border: 0, filter: "saturate(0.85) contrast(1.05)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${salonName}の地図`}
          />
        </div>
      )}
    </section>
  );
}
