"use client";

import { SELECT_CLASS } from "./types";

type Props = {
  label: string;
  hour: string;
  minute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  /** 自動計算の表示制御 */
  autoCalcInfo?: {
    isManual: boolean;
    hasMenus: boolean;
    onResetAuto: () => void;
  };
  /** 営業時間外警告メッセージ */
  warningMessage?: string | null;
  /** 営業時間の範囲（グレーアウト用） */
  businessHoursRange?: { openHour: number; closeHour: number } | null;
};

export function TimePicker({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  autoCalcInfo,
  warningMessage,
  businessHoursRange,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium">{label}</label>
        {autoCalcInfo && autoCalcInfo.hasMenus && (
          <span className={`text-xs ${autoCalcInfo.isManual ? "text-orange-500" : "text-accent"}`}>
            {autoCalcInfo.isManual ? "手動設定" : "メニューから自動計算"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => onHourChange(e.target.value)}
          className={SELECT_CLASS}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const isOutside = businessHoursRange
              ? i < businessHoursRange.openHour || i >= businessHoursRange.closeHour
              : false;
            return (
              <option key={i} value={String(i)} className={isOutside ? "text-gray-400" : ""}>
                {String(i).padStart(2, "0")}{isOutside ? " (営業外)" : ""}
              </option>
            );
          })}
        </select>
        <span className="text-lg font-medium">:</span>
        <select
          value={minute}
          onChange={(e) => onMinuteChange(e.target.value)}
          className={SELECT_CLASS}
        >
          {["00", "15", "30", "45"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      {autoCalcInfo && autoCalcInfo.isManual && autoCalcInfo.hasMenus && (
        <button
          type="button"
          onClick={autoCalcInfo.onResetAuto}
          className="text-xs text-accent hover:underline mt-1"
        >
          自動計算に戻す
        </button>
      )}
      {warningMessage && (
        <p className="text-xs text-warning mt-1">{warningMessage}</p>
      )}
    </div>
  );
}
