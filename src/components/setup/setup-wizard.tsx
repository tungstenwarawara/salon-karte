"use client";

import { useState, useCallback } from "react";
import type { BusinessHours } from "@/types/database";
import type { BusinessType } from "@/lib/menu-presets";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SetupProgressBar } from "./setup-progress-bar";
import { StepSalonInfo } from "./step-salon-info";
import { StepBusinessHours } from "./step-business-hours";
import { StepFirstMenu } from "./step-first-menu";
import { StepComplete } from "./step-complete";

export type WizardData = {
  salonName: string;
  phone: string;
  address: string;
  businessType: BusinessType;
  businessHours: BusinessHours | null;
  menuName: string | null;
  menuDuration: number | null;
  menuPrice: number | null;
  withSample: boolean;
};

type StepNum = 1 | 2 | 3 | 4;

export function SetupWizard({ onComplete, loading }: { onComplete: (data: WizardData) => void; loading?: boolean }) {
  const [step, setStep] = useState<StepNum>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);

  // 各ステップのデータ
  const [salonInfo, setSalonInfo] = useState<{ name: string; phone: string; address: string; businessType: BusinessType | "" }>({ name: "", phone: "", address: "", businessType: "" });
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [menuData, setMenuData] = useState<{ name: string; duration: number | null; price: number | null } | null>(null);

  const goTo = useCallback((next: StepNum, dir: "forward" | "back" = "forward") => {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
  }, []);

  // Step 1: サロン情報
  const handleSalonInfo = useCallback((data: { name: string; phone: string; address: string; businessType: BusinessType }) => {
    setSalonInfo(data);
    goTo(2);
  }, [goTo]);

  // Step 2: 営業時間
  const handleBusinessHours = useCallback((hours: BusinessHours) => {
    setBusinessHours(hours);
    goTo(3);
  }, [goTo]);

  const skipBusinessHours = useCallback(() => {
    setBusinessHours(null);
    goTo(3);
  }, [goTo]);

  // Step 3: メニュー
  const handleMenu = useCallback((data: { name: string; duration: number | null; price: number | null }) => {
    setMenuData(data);
    goTo(4);
  }, [goTo]);

  const skipMenu = useCallback(() => {
    setMenuData(null);
    goTo(4);
  }, [goTo]);

  // Step 4: 完了
  const handleStart = useCallback((withSample: boolean) => {
    if (!salonInfo.businessType) return; // Step1必須なので通常到達しない
    onComplete({
      salonName: salonInfo.name,
      phone: salonInfo.phone,
      address: salonInfo.address,
      businessType: salonInfo.businessType,
      businessHours,
      menuName: menuData?.name ?? null,
      menuDuration: menuData?.duration ?? null,
      menuPrice: menuData?.price ?? null,
      withSample,
    });
  }, [onComplete, salonInfo, businessHours, menuData]);

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

        {/* 戻るボタン（Step 2, 3） */}
        {(step === 2 || step === 3) && (
          <button
            type="button"
            onClick={() => goTo((step - 1) as StepNum, "back")}
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
          className={step === 4 ? "" : animClass}
        >
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-5">
            {step === 1 && (
              <StepSalonInfo
                onNext={handleSalonInfo}
                initial={salonInfo.businessType ? { ...salonInfo, businessType: salonInfo.businessType } : undefined}
              />
            )}
            {step === 2 && (
              <StepBusinessHours
                onNext={handleBusinessHours}
                onSkip={skipBusinessHours}
                initial={businessHours}
              />
            )}
            {step === 3 && (
              <StepFirstMenu
                onNext={handleMenu}
                onSkip={skipMenu}
                businessType={salonInfo.businessType || null}
                initial={
                  menuData
                    ? { name: menuData.name, duration: menuData.duration, price: menuData.price }
                    : undefined
                }
              />
            )}
            {step === 4 && (
              <StepComplete
                salonName={salonInfo.name}
                setupSummary={{
                  businessHours: businessHours !== null,
                  menu: menuData !== null,
                }}
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
