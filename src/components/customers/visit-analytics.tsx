import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

type Props = {
  customerId: string;
  visitCount: number;
  daysSinceLastVisit: number | null;
  avgInterval: number | null;
  nextAppointment: Appointment | null;
};

export function VisitAnalytics({
  customerId,
  visitCount,
  daysSinceLastVisit,
  avgInterval,
  nextAppointment,
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
      {nextAppointment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          次回予約: {formatDateShort(nextAppointment.appointment_date)}{" "}
          {(nextAppointment.start_time as string).slice(0, 5)}
          {nextAppointment.menu_name_snapshot && ` / ${nextAppointment.menu_name_snapshot}`}
        </div>
      )}
      {!nextAppointment && visitCount > 0 && (
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
