import Link from "next/link";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentWithCustomer = Appointment & {
  customers: { last_name: string; first_name: string } | null;
};

export function TodayAppointments({
  appointments,
}: {
  appointments: AppointmentWithCustomer[] | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">今日の予約</h3>
        <Link href="/appointments" className="text-xs text-accent hover:underline">
          すべて見る →
        </Link>
      </div>
      {appointments && appointments.length > 0 ? (
        <div className="space-y-2">
          {appointments.map((apt) => {
            const customer = apt.customers;
            const isCompleted = apt.status === "completed";
            return (
              <Link
                key={apt.id}
                href={`/customers/${apt.customer_id}`}
                className={`block bg-surface border rounded-xl p-3 hover:border-accent transition-colors ${
                  isCompleted ? "border-green-200 bg-green-50/50" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-accent tabular-nums">
                      {(apt.start_time as string).slice(0, 5)}
                    </span>
                    <span className="font-medium text-sm">
                      {customer
                        ? `${customer.last_name} ${customer.first_name}`
                        : "不明"}
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      来店済
                    </span>
                  )}
                </div>
                {apt.menu_name_snapshot && (
                  <p className="text-xs text-text-light mt-1 ml-[3.5rem]">
                    {apt.menu_name_snapshot}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-4 text-center text-text-light text-sm">
          今日の予約はありません
        </div>
      )}
    </div>
  );
}
