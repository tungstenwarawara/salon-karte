"use client";

import { useState } from "react";
import type { CounselingTemplate, CounselingResponseData } from "@/types/counseling-template";
import { StepIndicator } from "./step-indicator";
import { TemplateStep } from "./template-step";

type Props = {
  template: CounselingTemplate;
};

/** 顧客視点のプレビュー表示（実際の入力フォームと同じ見た目） */
export function TemplatePreview({ template }: Props) {
  const sections = template.sections;
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<CounselingResponseData>(() => {
    const init: CounselingResponseData = {};
    for (const s of sections) init[s.id] = {};
    return init;
  });

  if (sections.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-light text-sm">セクションがありません</p>
      </div>
    );
  }

  const current = sections[step];
  const isLast = step === sections.length - 1;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
      <p className="text-xs text-text-light text-center bg-accent/10 rounded-lg py-1">
        プレビュー（顧客に見える画面）
      </p>

      <StepIndicator labels={sections.map((s) => s.title)} currentStep={step} />

      <TemplateStep
        section={current}
        data={responses[current.id] ?? {}}
        onChange={(data) => setResponses((prev) => ({ ...prev, [current.id]: data }))}
      />

      {isLast && (
        <label className="flex items-start gap-3 p-3 border border-border rounded-lg bg-surface cursor-pointer">
          <input type="checkbox" disabled className="mt-0.5 w-5 h-5 accent-accent flex-shrink-0" />
          <span className="text-xs text-text-light leading-relaxed">
            入力いただいた内容は、施術サービスの向上を目的として当サロンが適切に管理・利用いたします。
          </span>
        </label>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)}
            className="flex-1 border border-border rounded-lg py-3 text-sm font-medium min-h-[48px]">
            戻る
          </button>
        )}
        <button
          type="button"
          onClick={() => !isLast && setStep((s) => s + 1)}
          disabled={isLast}
          className="flex-1 bg-accent text-white rounded-lg py-3 text-sm font-medium min-h-[48px] disabled:opacity-50"
        >
          {isLast ? "送信する" : "次へ"}
        </button>
      </div>
    </div>
  );
}
