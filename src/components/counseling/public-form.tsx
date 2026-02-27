"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./step-indicator";
import { TemplateStep } from "./template-step";
import { BasicInfoStep, type CustomerInfo } from "./basic-info-step";
import type { CounselingTemplate, CounselingResponseData } from "@/types/counseling-template";

type Props = {
  token: string;
  template: CounselingTemplate;
  isAnonymous?: boolean;
};

const emptyCustomerInfo: CustomerInfo = {
  last_name: "", first_name: "",
  last_name_kana: "", first_name_kana: "",
  phone: "", email: "", gender: "", birth_date: "",
};

export function PublicForm({ token, template, isAnonymous = false }: Props) {
  const router = useRouter();
  const sections = template.sections;
  const totalSteps = sections.length + (isAnonymous ? 1 : 0);

  const [step, setStep] = useState(0);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(emptyCustomerInfo);
  const [responses, setResponses] = useState<CounselingResponseData>(() => {
    const init: CounselingResponseData = {};
    for (const s of sections) { init[s.id] = {}; }
    return init;
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLastStep = step === totalSteps - 1;
  const isBasicInfoStep = isAnonymous && step === 0;
  const sectionIndex = isAnonymous ? step - 1 : step;
  const currentSection = !isBasicInfoStep ? sections[sectionIndex] : null;

  const stepLabels = [
    ...(isAnonymous ? ["基本情報"] : []),
    ...sections.map((s) => s.title),
  ];

  const handleNext = () => {
    if (isBasicInfoStep && (!customerInfo.last_name.trim() || !customerInfo.first_name.trim())) {
      setError("お名前（姓・名）は必須です");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const body: Record<string, unknown> = { responses };
      if (isAnonymous) {
        body.customer_info = {
          last_name: customerInfo.last_name.trim(),
          first_name: customerInfo.first_name.trim(),
          last_name_kana: customerInfo.last_name_kana.trim() || undefined,
          first_name_kana: customerInfo.first_name_kana.trim() || undefined,
          phone: customerInfo.phone.trim() || undefined,
          email: customerInfo.email.trim() || undefined,
          gender: customerInfo.gender || undefined,
          birth_date: customerInfo.birth_date || undefined,
        };
      }

      const res = await fetch(`/api/counseling/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "送信に失敗しました");
        setSubmitting(false);
        return;
      }

      router.push(`/c/${token}/complete`);
    } catch {
      setError("通信エラーが発生しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <StepIndicator labels={stepLabels} currentStep={step} />

      {isBasicInfoStep ? (
        <BasicInfoStep data={customerInfo} onChange={setCustomerInfo} />
      ) : currentSection ? (
        <TemplateStep
          section={currentSection}
          data={responses[currentSection.id] ?? {}}
          onChange={(data) => setResponses((prev) => ({ ...prev, [currentSection.id]: data }))}
        />
      ) : null}

      {isLastStep && (
        <label className="flex items-start gap-3 p-3 border border-border rounded-lg bg-surface cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-accent flex-shrink-0"
          />
          <span className="text-xs text-text-light leading-relaxed">
            入力いただいた内容は、施術サービスの向上を目的として当サロンが適切に管理・利用いたします。
          </span>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setError(""); setStep((s) => s - 1); }}
            className="flex-1 border border-border rounded-lg py-3 text-sm font-medium min-h-[48px]"
          >
            戻る
          </button>
        )}

        {!isLastStep ? (
          <button type="button" onClick={handleNext} className="flex-1 bg-accent text-white rounded-lg py-3 text-sm font-medium min-h-[48px]">
            次へ
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!agreed || submitting}
            className="flex-1 bg-accent text-white rounded-lg py-3 text-sm font-medium min-h-[48px] disabled:opacity-50"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
        )}
      </div>
    </div>
  );
}
