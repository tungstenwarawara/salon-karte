"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./step-indicator";
import { TemplateStep } from "./template-step";
import type { CounselingTemplate, CounselingResponseData } from "@/types/counseling-template";

type Props = {
  token: string;
  template: CounselingTemplate;
};

export function PublicForm({ token, template }: Props) {
  const router = useRouter();
  const sections = template.sections;
  const totalSteps = sections.length;

  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<CounselingResponseData>(() => {
    const init: CounselingResponseData = {};
    for (const s of sections) {
      init[s.id] = {};
    }
    return init;
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLastStep = step === totalSteps - 1;
  const currentSection = sections[step];

  const handleSubmit = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/counseling/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
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
      <StepIndicator labels={sections.map((s) => s.title)} currentStep={step} />

      <TemplateStep
        section={currentSection}
        data={responses[currentSection.id] ?? {}}
        onChange={(data) => setResponses((prev) => ({ ...prev, [currentSection.id]: data }))}
      />

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
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 border border-border rounded-lg py-3 text-sm font-medium min-h-[48px]"
          >
            戻る
          </button>
        )}

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 bg-accent text-white rounded-lg py-3 text-sm font-medium min-h-[48px]"
          >
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
