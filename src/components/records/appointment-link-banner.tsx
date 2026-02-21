"use client";

type DetectedAppointment = {
  id: string;
  start_time: string;
  menu_name_snapshot: string | null;
};

type Props = {
  appointment: DetectedAppointment;
  onLink: () => void;
  onDismiss: () => void;
};

/** 当日予約が見つかった場合の紐づけ提案バナー */
export function AppointmentLinkBanner({ appointment, onLink, onDismiss }: Props) {
  const time = appointment.start_time?.slice(0, 5) ?? "";

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 mt-0.5 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">
            本日 {time} の予約があります
          </p>
          {appointment.menu_name_snapshot && (
            <p className="text-xs text-blue-700 mt-0.5">{appointment.menu_name_snapshot}</p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            紐づけると予約メニューが自動入力され、予約が完了になります
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onLink}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]">
          この予約と紐づける
        </button>
        <button type="button" onClick={onDismiss}
          className="px-4 text-sm text-blue-600 hover:text-blue-800 transition-colors min-h-[44px]">
          スキップ
        </button>
      </div>
    </div>
  );
}
