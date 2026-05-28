"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const CelebrationModal = dynamic(
  () => import("@/components/ui/celebration-modal").then((m) => m.CelebrationModal),
  { ssr: false }
);
import { useOnceFlag } from "@/lib/hooks/use-first-visit";

type SetupStep = {
  done: boolean;
  label: string;
  href: string;
  phase: 1 | 2;
};

export function OnboardingChecklist({
  setupSteps,
}: {
  setupSteps: SetupStep[];
}) {
  const phase1Steps = setupSteps.filter((s) => s.phase === 1);
  const phase2Steps = setupSteps.filter((s) => s.phase === 2);
  const phase1Done = phase1Steps.every((s) => s.done);
  const allDone = setupSteps.every((s) => s.done);
  const completedCount = setupSteps.filter((s) => s.done).length;
  const totalSteps = setupSteps.length;
  const displayCompleted = completedCount;

  const { shouldShow: shouldCelebrate, markDone: markCelebrated } = useOnceFlag("checklist_completed");
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (allDone && shouldCelebrate()) {
      const timer = setTimeout(() => setShowCelebration(true), 600);
      return () => clearTimeout(timer);
    }
  }, [allDone, shouldCelebrate]);

  // 全完了後は非表示
  if (allDone && !showCelebration) return null;

  return (
    <>
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">はじめの設定</h3>
          <span className="text-xs text-accent font-medium">{displayCompleted}/{totalSteps} 完了</span>
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-border rounded-full h-1.5">
          <div
            className="bg-accent rounded-full h-1.5 transition-all duration-700"
            style={{ width: `${(displayCompleted / totalSteps) * 100}%` }}
          />
        </div>

        {/* Phase 1 ステップ */}
        <div className="space-y-2">
          {phase1Steps.map((step) => (
            <StepItem key={step.href} step={step} />
          ))}
        </div>

        {/* Phase 2 ステップ */}
        {phase2Steps.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-accent/10">
            <p className="text-[10px] text-accent font-medium">実務をはじめる</p>
            {phase2Steps.map((step) => (
              <StepItem key={step.href} step={step} />
            ))}
          </div>
        )}
      </div>

      {showCelebration && (
        <CelebrationModal
          title="初期設定が完了しました！"
          message="基本的な使い方をマスターしました。これからもサロンカルテをご活用ください。"
          onClose={() => {
            markCelebrated();
            setShowCelebration(false);
          }}
        />
      )}
    </>
  );
}

function StepItem({ step }: { step: SetupStep }) {
  return (
    <Link
      href={step.href}
      className={`flex items-center gap-3 p-2 rounded-xl transition-colors min-h-[44px] ${
        step.done ? "opacity-60" : "hover:bg-accent/10"
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        step.done ? "bg-success text-white animate-check-pop" : "border-2 border-border"
      }`}>
        {step.done && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${step.done ? "line-through text-text-light" : "font-medium"}`}>
        {step.label}
      </span>
      {!step.done && (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-light ml-auto">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </Link>
  );
}
