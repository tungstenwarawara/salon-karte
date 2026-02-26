type Props = {
  labels: string[];
  currentStep: number;
};

export function StepIndicator({ labels, currentStep }: Props) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => (
        <div key={i} className="flex-1 text-center">
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
