"use client";

import { useState, useCallback } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SetupProgressBar } from "./setup-progress-bar";
import { StepSalonInfo } from "./step-salon-info";
import { StepMenuPresets, type PresetMenu } from "./step-menu-presets";
import { StepComplete } from "./step-complete";

export type WizardData = {
  salonName: string;
  phone: string;
  address: string;
  menus: PresetMenu[];
};

type StepNum = 1 | 2 | 3;

export function SetupWizard({ onComplete, loading }: { onComplete: (data: WizardData) => void; loading?: boolean }) {
  const [step, setStep] = useState<StepNum>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);

  // 各ステップのデータ
  const [salonInfo, setSalonInfo] = useState({ name: "", phone: "", address: "" });
  const [menus, setMenus] = useState<PresetMenu[]>([]);

  const goTo = useCallback((next: StepNum, dir: "forward" | "back" = "forward") => {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
  }, []);

  // Step 1: サロン情報
  const handleSalonInfo = useCallback((data: { name: string; phone: string; address: string }) => {
    setSalonInfo(data);
    goTo(2);
  }, [goTo]);

  // Step 2: 業種選択+メニュー
  const handleMenus = useCallback((selected: PresetMenu[]) => {
    setMenus(selected);
    goTo(3);
  }, [goTo]);

  const skipMenus = useCallback(() => {
    setMenus([]);
    goTo(3);
  }, [goTo]);

  // Step 3: 完了
  const handleStart = useCallback(() => {
    onComplete({
      salonName: salonInfo.name,
      phone: salonInfo.phone,
      address: salonInfo.address,
      menus,
    });
  }, [onComplete, salonInfo, menus]);

  const animClass = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-md space-y-6">
        {/* ロゴ */}
        <div className="flex justify-center">
          <BrandLogo size="lg" />
        </div>

        {/* プログレスバー */}
        <SetupProgressBar currentStep={step} />

        {/* 戻るボタン（Step 2） */}
        {step === 2 && (
          <button
            type="button"
            onClick={() => goTo(1, "back")}
            className="flex items-center gap-1 text-sm text-text-light hover:text-accent transition-colors min-h-[44px] -mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            戻る
          </button>
        )}

        {/* ステップコンテンツ */}
        <div
          key={animKey}
          className={step === 3 ? "" : animClass}
        >
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-5">
            {step === 1 && <StepSalonInfo onNext={handleSalonInfo} />}
            {step === 2 && <StepMenuPresets onNext={handleMenus} onSkip={skipMenus} />}
            {step === 3 && (
              <StepComplete
                salonName={salonInfo.name}
                menuCount={menus.length}
                onStart={handleStart}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
