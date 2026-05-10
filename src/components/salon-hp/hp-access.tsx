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

/** NANA系: 細罫線レイアウト、影なし、英字曜日 */
export function HpAccess({ access, salonName, address, phone, businessHours }: Props) {
  return (
    <section className="py-24 md:py-32 hp-section bg-[#F4ECDD]/40">
      <div className="max-w-4xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Access</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            アクセス
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-14">
          {/* 左: 情報 */}
          <div className="space-y-6">
            <div className="border-b border-[#E5DBCB]/60 pb-4">
              <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">Salon</p>
              <p
                className="text-base md:text-lg text-gray-800 tracking-wider"
                style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
              >
                {salonName}
              </p>
            </div>

            {address && (
              <div className="border-b border-[#E5DBCB]/60 pb-4">
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">Address</p>
                <p className="text-sm text-gray-700 leading-[1.9] tracking-wider">{address}</p>
              </div>
            )}

            {access.station && (
              <div className="border-b border-[#E5DBCB]/60 pb-4">
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">Station</p>
                <p className="text-sm text-gray-700 tracking-wider">{access.station}</p>
              </div>
            )}

            {phone && (
              <div className="border-b border-[#E5DBCB]/60 pb-4">
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">Tel</p>
                <a
                  href={`tel:${phone}`}
                  className="text-sm text-gray-700 tracking-wider hover:text-[#9B7A52] transition-colors"
                >
                  {phone}
                </a>
              </div>
            )}

            {access.details && (
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">Note</p>
                <p className="text-xs text-gray-500 leading-[1.9] tracking-wider whitespace-pre-line">
                  {access.details}
                </p>
              </div>
            )}
          </div>

          {/* 右: 営業時間 */}
          <div>
            {businessHours && (
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-5">Hours</p>
                <ul className="space-y-3">
                  {DAY_LABELS.map(({ key, label }) => {
                    const day = businessHours[key];
                    return (
                      <li
                        key={key}
                        className="flex items-baseline justify-between border-b border-[#E5DBCB]/40 pb-2 text-sm tracking-wider"
                      >
                        <span
                          className={`text-[11px] tracking-[0.25em] uppercase ${
                            day.is_open ? "text-gray-600" : "text-gray-300"
                          }`}
                        >
                          {label}
                        </span>
                        {day.is_open ? (
                          <span className="text-gray-700 tabular-nums">
                            {day.open_time} 〜 {day.close_time}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Closed</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Google Map */}
        {access.google_maps_embed_url && (
          <div className="mt-12 md:mt-16 overflow-hidden border border-[#E5DBCB]/60">
            <iframe
              src={access.google_maps_embed_url}
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${salonName}の地図`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
