"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./step-indicator";
import { StepHealth } from "./step-health";
import { StepTreatment } from "./step-treatment";
import { StepOther } from "./step-other";

type Props = {
  token: string;
};

const INITIAL_HEALTH = { allergies: "", medications: "", conditions: [] as string[], notes: "" };
const INITIAL_TREATMENT = { concerns: "", desired_outcome: "", frequency: "", budget: "" };
const INITIAL_OTHER = { referral_source: "", notes: "" };

export function PublicForm({ token }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [health, setHealth] = useState(INITIAL_HEALTH);
  const [treatment, setTreatment] = useState(INITIAL_TREATMENT);
  const [other, setOther] = useState(INITIAL_OTHER);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = agreed;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/counseling/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: { health, treatment, other },
        }),
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
      <StepIndicator currentStep={step} />

      {step === 0 && <StepHealth data={health} onChange={setHealth} />}
      {step === 1 && <StepTreatment data={treatment} onChange={setTreatment} />}
      {step === 2 && (
        <StepOther data={other} onChange={setOther} agreed={agreed} onAgreeChange={setAgreed} />
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

        {step < 2 ? (
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
            disabled={!canSubmit || submitting}
            className="flex-1 bg-accent text-white rounded-lg py-3 text-sm font-medium min-h-[48px] disabled:opacity-50"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
        )}
      </div>
    </div>
  );
}
