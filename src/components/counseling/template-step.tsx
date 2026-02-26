import type { TemplateSection } from "@/types/counseling-template";

type StepData = { [fieldId: string]: string | string[] };

type Props = {
  section: TemplateSection;
  data: StepData;
  onChange: (data: StepData) => void;
};

/** テンプレートの1セクションを描画する汎用ステップコンポーネント */
export function TemplateStep({ section, data, onChange }: Props) {
  const update = (fieldId: string, value: string | string[]) => {
    onChange({ ...data, [fieldId]: value });
  };

  const toggleCheckbox = (fieldId: string, option: string) => {
    const current = (data[fieldId] as string[] | undefined) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    update(fieldId, next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">{section.title}</h2>
      {section.description && (
        <p className="text-sm text-text-light whitespace-pre-wrap">{section.description}</p>
      )}

      {section.fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              value={(data[field.id] as string) ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            />
          )}

          {field.type === "textarea" && (
            <textarea
              value={(data[field.id] as string) ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
            />
          )}

          {field.type === "checkbox" && field.options && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => {
                const checked = ((data[field.id] as string[] | undefined) ?? []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheckbox(field.id, opt)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors min-h-[44px] ${
                      checked
                        ? "bg-accent text-white border-accent"
                        : "bg-surface border-border text-text-light"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === "radio" && field.options && (
            <div className="space-y-1">
              {field.options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface cursor-pointer min-h-[44px]"
                >
                  <input
                    type="radio"
                    name={`${section.id}_${field.id}`}
                    checked={(data[field.id] as string) === opt}
                    onChange={() => update(field.id, opt)}
                    className="w-4 h-4 accent-accent flex-shrink-0"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
