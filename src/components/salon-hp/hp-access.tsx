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
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          アクセス
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">Access</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 情報 */}
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-1">サロン名</p>
              <p className="font-medium text-gray-900">{salonName}</p>
            </div>

            {address && (
              <div>
                <p className="text-xs text-gray-400 mb-1">住所</p>
                <p className="text-gray-700">{address}</p>
              </div>
            )}

            {access.station && (
              <div>
                <p className="text-xs text-gray-400 mb-1">最寄り駅</p>
                <p className="text-gray-700">{access.station}</p>
              </div>
            )}

            {phone && (
              <div>
                <p className="text-xs text-gray-400 mb-1">電話番号</p>
                <a href={`tel:${phone}`} className="text-gray-700 hover:text-[#C4956A] transition-colors">
                  {phone}
                </a>
              </div>
            )}

            {access.details && (
              <div>
                <p className="text-xs text-gray-400 mb-1">道順</p>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                  {access.details}
                </p>
              </div>
            )}
          </div>

          {/* 営業時間 */}
          {businessHours && (
            <div>
              <p className="text-xs text-gray-400 mb-3">営業時間</p>
              <div className="space-y-2">
                {DAY_LABELS.map(({ key, label }) => {
                  const day = businessHours[key];
                  return (
                    <div key={key} className="flex items-center text-sm">
                      <span className="w-6 text-gray-500 font-medium">{label}</span>
                      {day.is_open ? (
                        <span className="text-gray-700">
                          {day.open_time} 〜 {day.close_time}
                        </span>
                      ) : (
                        <span className="text-gray-400">定休日</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Google Map */}
        {access.google_maps_embed_url && (
          <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100">
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
