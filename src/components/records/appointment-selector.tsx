"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateShort } from "@/lib/format";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  start_time: string;
  menu_name_snapshot: string | null;
  status: string;
  customers: { id: string; last_name: string; first_name: string } | null;
};

export type SelectedAppointment = {
  appointmentId: string;
  customerId: string;
  customerName: string;
  appointmentDate: string;
};

type Props = {
  salonId: string;
  onSelect: (data: SelectedAppointment) => void;
  onSkip: () => void;
};

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AppointmentSelector({ salonId, onSelect, onSkip }: Props) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    const load = async () => {
      const supabase = createClient();
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const pastStr = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, "0")}-${String(past30.getDate()).padStart(2, "0")}`;
      const future30 = new Date();
      future30.setDate(future30.getDate() + 30);
      const futureStr = `${future30.getFullYear()}-${String(future30.getMonth() + 1).padStart(2, "0")}-${String(future30.getDate()).padStart(2, "0")}`;

      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, menu_name_snapshot, status, customers(id, last_name, first_name)")
        .eq("salon_id", salonId)
        .is("treatment_record_id", null)
        .in("status", ["scheduled", "completed"])
        .gte("appointment_date", pastStr)
        .lte("appointment_date", futureStr)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: true })
        .returns<AppointmentRow[]>();

      setAppointments(data ?? []);
      setLoading(false);
    };
    load();
  }, [salonId]);

  const today = getToday();
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const otherAppts = appointments.filter((a) => a.appointment_date !== today);

  const handleSelect = (apt: AppointmentRow) => {
    if (!apt.customers) return;
    onSelect({
      appointmentId: apt.id,
      customerId: apt.customers.id,
      customerName: `${apt.customers.last_name} ${apt.customers.first_name}`,
      appointmentDate: apt.appointment_date,
    });
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <p className="text-text-light text-sm">予約を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">予約からカルテを作成</h3>
        <p className="text-sm text-text-light">カルテに紐づけたい予約を選んでください。日付・顧客・メニューが自動で入力されます。</p>

        {appointments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-text-light">紐づけ可能な予約はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 本日の予約（サジェスト） */}
            {todayAppts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">本日の予約</p>
                {todayAppts.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} isToday onSelect={() => handleSelect(apt)} />
                ))}
              </div>
            )}

            {/* その他の予約 */}
            {otherAppts.length > 0 && (
              <div className="space-y-2">
                {todayAppts.length > 0 && <p className="text-sm font-medium text-text-light">その他の予約</p>}
                {otherAppts.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} isToday={false} onSelect={() => handleSelect(apt)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-sm text-accent hover:underline py-3 min-h-[48px]"
      >
        予約に紐づけずにカルテを作成
      </button>
    </div>
  );
}

function AppointmentCard({ appointment, isToday, onSelect }: { appointment: AppointmentRow; isToday: boolean; onSelect: () => void }) {
  const customer = appointment.customers;
  const time = appointment.start_time?.slice(0, 5) ?? "";
  const statusLabel = appointment.status === "completed" ? "来店済" : "予定";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-3 transition-colors min-h-[48px] ${
        isToday
          ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
          : "bg-background border border-border hover:border-accent"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {!isToday && <span className="text-sm text-text-light shrink-0">{formatDateShort(appointment.appointment_date)}</span>}
          <span className="text-sm font-medium shrink-0">{time}</span>
          {customer && <span className="text-sm truncate">{customer.last_name} {customer.first_name}</span>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
          appointment.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        }`}>{statusLabel}</span>
      </div>
      {appointment.menu_name_snapshot && (
        <p className={`text-xs mt-1 ${isToday ? "text-blue-700" : "text-text-light"}`}>
          {appointment.menu_name_snapshot}
        </p>
      )}
    </button>
  );
}
