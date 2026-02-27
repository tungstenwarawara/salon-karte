"use client";

import { useRef, useEffect } from "react";
import { WeekGridColumn, HOUR_HEIGHT } from "./week-grid-column";
import type { ColumnDef } from "./week-grid-column";

type Props = {
  columns: ColumnDef[];
  startHour: number;
  endHour: number;
  todayStr: string;
};

/** スクロール可能な時間グリッド本体 */
export function WeekTimeGrid({ columns, startHour, endHour, todayStr }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;
  const colCount = columns.length;

  // 現在時刻付近までスクロール
  useEffect(() => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const rangeStartMin = startHour * 60;
    if (currentMin >= rangeStartMin) {
      const scrollTop = ((currentMin - rangeStartMin) / 60) * HOUR_HEIGHT - 100;
      scrollRef.current?.scrollTo({ top: Math.max(0, scrollTop) });
    }
  }, [startHour]);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* カラムヘッダー */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: `35px repeat(${colCount}, 1fr)` }}>
        <div className="p-1" />
        {columns.map((col) => {
          const isToday = col.dateStr === todayStr;
          return (
            <div
              key={col.key}
              className={`p-1.5 text-center text-xs border-l border-border truncate ${isToday ? "bg-accent/10 font-bold text-accent" : "text-text-light"}`}
            >
              {col.label}
            </div>
          );
        })}
      </div>

      {/* スクロール可能なグリッド本体 */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
        <div className="grid" style={{ gridTemplateColumns: `35px repeat(${colCount}, 1fr)` }}>
          {/* 時間ラベル */}
          <div className="relative bg-surface" style={{ height: `${totalHeight}px` }}>
            {Array.from({ length: endHour - startHour }, (_, i) => (
              <div
                key={i}
                className="absolute text-[10px] text-text-light leading-none"
                style={{ top: `${i * HOUR_HEIGHT}px`, right: "4px", transform: "translateY(-50%)" }}
              >
                {i > 0 ? `${startHour + i}:00` : ""}
              </div>
            ))}
          </div>

          {/* データカラム */}
          {columns.map((col) => (
            <WeekGridColumn key={col.key} column={col} startHour={startHour} endHour={endHour} />
          ))}
        </div>
      </div>
    </div>
  );
}
