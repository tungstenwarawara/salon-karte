import Link from "next/link";

type SetupStep = {
  done: boolean;
  label: string;
  href: string;
};

export function OnboardingChecklist({
  setupSteps,
  completedSteps,
}: {
  setupSteps: SetupStep[];
  completedSteps: number;
}) {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">はじめの設定</h3>
        <span className="text-xs text-accent font-medium">{completedSteps}/{setupSteps.length} 完了</span>
      </div>
      <div className="w-full bg-border rounded-full h-1.5">
        <div
          className="bg-accent rounded-full h-1.5 transition-all"
          style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {setupSteps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              step.done ? "opacity-60" : "hover:bg-accent/10"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              step.done ? "bg-success text-white" : "border-2 border-border"
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
        ))}
      </div>
    </div>
  );
}
