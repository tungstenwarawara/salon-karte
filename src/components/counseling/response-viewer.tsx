// JSONB回答の型定義
type HealthData = { allergies?: string; medications?: string; conditions?: string[]; notes?: string };
type TreatmentData = { concerns?: string; desired_outcome?: string; frequency?: string; budget?: string };
type OtherData = { referral_source?: string; notes?: string };
export type CounselingResponses = { health?: HealthData; treatment?: TreatmentData; other?: OtherData };

export function ResponseViewer({ responses }: { responses: CounselingResponses | null }) {
  if (!responses) return <p className="text-xs text-text-light">回答データがありません</p>;

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
