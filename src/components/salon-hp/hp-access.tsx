import type { SalonHpContent, BusinessHours } from "@/types/database";

type Props = {
  access: SalonHpContent["access"];
  salonName: string;
  address: string | null;
  phone: string | null;
  businessHours: BusinessHours | null;
};

const DAY_LABELS: { key: keyof BusinessHours; label: string }[] = [
  { key: "monday", label: "月" },
  { key: "tuesday", label: "火" },
  { key: "wednesday", label: "水" },
  { key: "thursday", label: "木" },
  { key: "friday", label: "金" },
  { key: "saturday", label: "土" },
  { key: "sunday", label: "日" },
];

export function HpAccess({ access, salonName, address, phone, businessHours }: Props) {
  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          アクセス
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Access</p>

        <div className="bg-white rounded-2xl border border-[#E8E0D8]/60 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E0D8]/60">
            {/* 情報 */}
            <div className="p-7 space-y-5">
              <div>
                <p className="text-xs text-[#C4956A] font-medium mb-1.5">サロン名</p>
                <p className="font-bold text-gray-900">{salonName}</p>
              </div>

              {address && (
                <div>
                  <p className="text-xs text-[#C4956A] font-medium mb-1.5">住所</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{address}</p>
                </div>
              )}

              {access.station && (
                <div>
                  <p className="text-xs text-[#C4956A] font-medium mb-1.5">最寄り駅</p>
                  <p className="text-gray-700 text-sm">{access.station}</p>
                </div>
              )}

              {phone && (
                <div>
                  <p className="text-xs text-[#C4956A] font-medium mb-1.5">電話番号</p>
                  <a href={`tel:${phone}`} className="text-gray-700 text-sm hover:text-[#C4956A] transition-colors">
                    {phone}
                  </a>
                </div>
              )}

              {access.details && (
                <div>
                  <p className="text-xs text-[#C4956A] font-medium mb-1.5">道順</p>
                  <p className="text-sm text-gray-500 leading-[1.8] whitespace-pre-line">
                    {access.details}
                  </p>
                </div>
              )}
            </div>

            {/* 営業時間 */}
            {businessHours && (
              <div className="p-7">
                <p className="text-xs text-[#C4956A] font-medium mb-4">営業時間</p>
                <div className="space-y-2.5">
                  {DAY_LABELS.map(({ key, label }) => {
                    const day = businessHours[key];
                    return (
                      <div key={key} className="flex items-center text-sm">
                        <span className={`w-8 font-medium ${day.is_open ? "text-gray-600" : "text-gray-300"}`}>
                          {label}
                        </span>
                        {day.is_open ? (
                          <span className="text-gray-700 tabular-nums">
                            {day.open_time} 〜 {day.close_time}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">定休日</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Google Map */}
        {access.google_maps_embed_url && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-[#E8E0D8]/60 shadow-sm">
            <iframe
              src={access.google_maps_embed_url}
              width="100%"
              height="300"
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
