import type { CounselingResponseData, CounselingTemplate } from "@/types/counseling-template";

// 旧形式の型定義（後方互換用）
type LegacyHealthData = { allergies?: string; medications?: string; conditions?: string[]; notes?: string };
type LegacyTreatmentData = { concerns?: string; desired_outcome?: string; frequency?: string; budget?: string };
type LegacyOtherData = { referral_source?: string; notes?: string };
type LegacyResponses = { health?: LegacyHealthData; treatment?: LegacyTreatmentData; other?: LegacyOtherData };

// 旧形式のラベルマッピング
const LEGACY_LABELS: Record<string, Record<string, string>> = {
  health: { allergies: "アレルギー", medications: "服用中のお薬", conditions: "該当項目", notes: "備考" },
  treatment: { concerns: "お悩み", desired_outcome: "理想の仕上がり", frequency: "来店頻度", budget: "予算目安" },
  other: { referral_source: "きっかけ", notes: "ご要望" },
};
const LEGACY_SECTION_LABELS: Record<string, string> = {
  health: "健康状態・アレルギー",
  treatment: "施術のご希望",
  other: "その他",
};

function isLegacyFormat(responses: unknown): responses is LegacyResponses {
  const r = responses as Record<string, unknown>;
  return r && typeof r === "object" && ("health" in r || "treatment" in r || "other" in r)
    && !isSectionFormat(r);
}

function isSectionFormat(r: Record<string, unknown>): boolean {
  for (const val of Object.values(r)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner = Object.values(val as Record<string, unknown>);
      if (inner.length > 0 && (typeof inner[0] === "string" || Array.isArray(inner[0]))) {
        return true;
      }
    }
  }
  return false;
}

type Props = {
  responses: Record<string, unknown> | null;
  template?: CounselingTemplate | null;
};

export function ResponseViewer({ responses, template }: Props) {
  if (!responses) return <p className="text-sm text-text-light">回答データがありません</p>;

  if (isLegacyFormat(responses)) {
    return <LegacyViewer responses={responses} />;
  }

  // テンプレートからラベル解決用Mapを構築
  const sectionLabels = new Map<string, string>();
  const fieldLabels = new Map<string, Map<string, string>>();
  if (template) {
    for (const section of template.sections) {
      sectionLabels.set(section.id, section.title);
      const fMap = new Map<string, string>();
      for (const field of section.fields) {
        fMap.set(field.id, field.label);
      }
      fieldLabels.set(section.id, fMap);
    }
  }

  const data = responses as CounselingResponseData;

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([sectionId, fields]) => {
        const entries = Object.entries(fields).filter(([, v]) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== "" && v != null;
        });
        if (entries.length === 0) return null;

        const sectionTitle = sectionLabels.get(sectionId)
          ?? LEGACY_SECTION_LABELS[sectionId]
          ?? sectionId;

        return (
          <div key={sectionId} className="bg-surface border border-border rounded-xl p-3 space-y-2">
            <p className="text-sm font-bold">{sectionTitle}</p>
            {entries.map(([fieldId, value]) => {
              const label = fieldLabels.get(sectionId)?.get(fieldId)
                ?? LEGACY_LABELS[sectionId]?.[fieldId]
                ?? fieldId;
              if (Array.isArray(value) && value.length > 0) {
                return <TagRow key={fieldId} label={label} values={value} />;
              }
              return <Row key={fieldId} label={label} value={String(value)} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function LegacyViewer({ responses }: { responses: LegacyResponses }) {
  const { health, treatment, other } = responses;
  return (
    <div className="space-y-3">
      {health && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <p className="text-sm font-bold">健康状態・アレルギー</p>
          {health.allergies && <Row label="アレルギー" value={health.allergies} />}
          {health.medications && <Row label="服用中のお薬" value={health.medications} />}
          {health.conditions && health.conditions.length > 0 && (
            <TagRow label="該当項目" values={health.conditions} />
          )}
          {health.notes && <Row label="備考" value={health.notes} />}
        </div>
      )}
      {treatment && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <p className="text-sm font-bold">施術のご希望</p>
          {treatment.concerns && <Row label="お悩み" value={treatment.concerns} />}
          {treatment.desired_outcome && <Row label="理想の仕上がり" value={treatment.desired_outcome} />}
          {treatment.frequency && <Row label="来店頻度" value={treatment.frequency} />}
          {treatment.budget && <Row label="予算目安" value={treatment.budget} />}
        </div>
      )}
      {other && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <p className="text-sm font-bold">その他</p>
          {other.referral_source && <Row label="きっかけ" value={other.referral_source} />}
          {other.notes && <Row label="ご要望" value={other.notes} />}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-text-light">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function TagRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text-light">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
