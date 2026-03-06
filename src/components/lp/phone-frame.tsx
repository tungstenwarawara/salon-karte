/** 再利用可能なスマホモックアップフレーム */

import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** フレーム内コンテンツの最小高さ（デフォルト: 460px） */
  minHeight?: number;
  /** グロー効果を表示するか */
  glow?: boolean;
}

export function PhoneFrame({
  children,
  className = "",
  minHeight = 460,
  glow = true,
}: PhoneFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-accent/10 rounded-[44px] blur-2xl scale-105" />
      )}
      <div className="relative w-[260px] md:w-[280px] bg-white rounded-[36px] border-[6px] border-[#2D2D2D] shadow-2xl overflow-hidden">
        {/* ノッチ */}
        <div className="bg-[#2D2D2D] h-7 flex items-center justify-center">
          <div className="w-20 h-4 bg-[#1a1a1a] rounded-full" />
        </div>
        {/* コンテンツ */}
        <div className="bg-background overflow-hidden" style={{ minHeight }}>
          {children}
        </div>
        {/* ホームバー */}
        <div className="bg-white border-t border-border h-5 flex items-center justify-center">
          <div className="w-24 h-1 bg-border rounded-full" />
        </div>
      </div>
    </div>
  );
}
