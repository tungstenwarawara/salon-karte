import type { CounselingResponseData } from "@/types/counseling-template";

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
  // 新形式: 各値が { fieldId: value } のオブジェクト（配列でもstringでもないobject）
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

export function ResponseViewer({ responses }: { responses: Record<string, unknown> | null }) {
  if (!responses) return <p className="text-xs text-text-light">回答データがありません</p>;

  // 旧形式との後方互換
  if (isLegacyFormat(responses)) {
    return <LegacyViewer responses={responses} />;
  }

  // 新形式: CounselingResponseData
  const data = responses as CounselingResponseData;

  return (
    <div className="space-y-3 text-sm">
      {Object.entries(data).map(([sectionId, fields]) => {
        const entries = Object.entries(fields).filter(([, v]) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== "" && v != null;
        });
        if (entries.length === 0) return null;

        return (
          <div key={sectionId} className="space-y-1">
            <p className="text-xs font-bold text-text-light">
              {LEGACY_SECTION_LABELS[sectionId] ?? sectionId}
            </p>
            {entries.map(([fieldId, value]) => {
              const display = Array.isArray(value) ? value.join("、") : String(value);
              const label = LEGACY_LABELS[sectionId]?.[fieldId] ?? fieldId;
              return <Row key={fieldId} label={label} value={display} />;
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
    <div className="space-y-3 text-sm">
      {health && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-text-light">健康状態・アレルギー</p>
          {health.allergies && <Row label="アレルギー" value={health.allergies} />}
          {health.medications && <Row label="服用中のお薬" value={health.medications} />}
          {health.conditions && health.conditions.length > 0 && (
            <Row label="該当項目" value={health.conditions.join("、")} />
          )}
          {health.notes && <Row label="備考" value={health.notes} />}
        </div>
      )}
      {treatment && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-text-light">施術のご希望</p>
          {treatment.concerns && <Row label="お悩み" value={treatment.concerns} />}
          {treatment.desired_outcome && <Row label="理想の仕上がり" value={treatment.desired_outcome} />}
          {treatment.frequency && <Row label="来店頻度" value={treatment.frequency} />}
          {treatment.budget && <Row label="予算目安" value={treatment.budget} />}
        </div>
      )}
      {other && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-text-light">その他</p>
          {other.referral_source && <Row label="きっかけ" value={other.referral_source} />}
          {other.notes && <Row label="ご要望" value={other.notes} />}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-text-light w-24 flex-shrink-0">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  );
}
