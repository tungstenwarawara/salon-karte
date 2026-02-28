"use client";

type SubmitButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
  type?: "submit" | "button";
  onClick?: () => void;
};

/** フォーム送信ボタン（スピナー付き） */
export function SubmitButton({
  loading = false,
  disabled = false,
  label = "保存する",
  loadingLabel = "保存中...",
  className = "",
  type = "submit",
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
