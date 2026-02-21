const STEP_LABELS = ["健康状態", "施術の希望", "その他"];

type Props = {
  currentStep: number;
};

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex-1 text-center">
          <div
            className={`h-1.5 rounded-full mb-1 transition-colors ${
              i <= currentStep ? "bg-accent" : "bg-border"
            }`}
          />
          <span className={`text-[10px] ${i <= currentStep ? "text-accent font-bold" : "text-text-light"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
