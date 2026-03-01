const STEP_PROGRESS: Record<number, number> = { 1: 20, 2: 45, 3: 70, 4: 100 };
const STEP_LABELS = ["サロン情報", "営業時間", "メニュー", "完了"];

export function SetupProgressBar({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const pct = STEP_PROGRESS[currentStep];

  return (
    <div className="space-y-3">
      {/* プログレスバー */}
      <div className="relative h-1.5 bg-border/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #C4956A, #D4AD8A)",
          }}
        />
      </div>

      {/* ステップドット */}
      <div className="flex justify-between px-1">
        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const isActive = step <= currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  isActive
                    ? "bg-accent scale-110"
                    : "bg-border"
                }`}
              />
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive ? "text-accent font-medium" : "text-text-light/60"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
