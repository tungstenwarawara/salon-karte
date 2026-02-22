type Props = {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
};

export function ToggleRow({ label, description, checked, disabled, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${disabled ? "text-text-light" : ""}`}>{label}</p>
        <p className="text-xs text-text-light">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
