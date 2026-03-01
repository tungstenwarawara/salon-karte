import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

type Props = {
  customerId: string;
  visitCount: number;
  daysSinceLastVisit: number | null;
  avgInterval: number | null;
  futureAppointments: Appointment[];
};

export function VisitAnalytics({
  customerId,
  visitCount,
  daysSinceLastVisit,
  avgInterval,
  futureAppointments,
}: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-sm text-text-light">来店分析</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold text-accent">{visitCount}</p>
          <p className="text-xs text-text-light">来店回数</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {daysSinceLastVisit !== null ? daysSinceLastVisit : "-"}
          </p>
          <p className="text-xs text-text-light">
            {daysSinceLastVisit !== null ? "日前に来店" : "未来店"}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {avgInterval !== null ? `${avgInterval}` : "-"}
          </p>
          <p className="text-xs text-text-light">
            {avgInterval !== null ? "日（平均間隔）" : "平均間隔"}
          </p>
        </div>
      </div>
      {daysSinceLastVisit !== null && daysSinceLastVisit >= 60 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
          {daysSinceLastVisit >= 90
            ? "90日以上ご来店がありません。フォローの連絡をおすすめします。"
            : "60日以上ご来店がありません。"}
        </div>
      )}
      {futureAppointments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
          <p className="text-xs font-medium text-blue-600">
            予約予定（{futureAppointments.length}件）
          </p>
          {futureAppointments.map((appt) => (
            <div key={appt.id} className="text-sm text-blue-700 flex items-center gap-2">
              <span className="font-medium">
                {formatDateShort(appt.appointment_date)}{" "}
                {(appt.start_time as string).slice(0, 5)}
              </span>
              {appt.menu_name_snapshot && (
                <span className="text-blue-600 truncate">{appt.menu_name_snapshot}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {futureAppointments.length === 0 && visitCount > 0 && (
        <Link
          href={`/appointments/new?customer=${customerId}`}
          className="block text-center text-sm text-accent hover:underline"
        >
          次回予約を登録する
        </Link>
      )}
    </div>
  );
}
