// 顧客フォームの共通フィールドコンポーネント
// customers/new と customers/[id]/edit で共有
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";

/** 婚姻状況の選択肢 */
export const MARITAL_STATUSES = [
  { value: "", label: "選択してください" },
  { value: "未婚", label: "未婚" },
  { value: "既婚", label: "既婚" },
];

/** フォームの値の型 */
export type CustomerFormValues = {
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
  birth_date: string;
  phone: string;
  email: string;
  address: string;
  marital_status: string;
  has_children: string;
  dm_allowed: string;
  height_cm: string;
  weight_kg: string;
  allergies: string;
  treatment_goal: string;
  notes: string;
};

type Props = {
  form: CustomerFormValues;
  onUpdate: (field: string, value: string) => void;
  /** 新規作成時にプレースホルダーを表示 */
  isNew?: boolean;
  inputClass: string;
};

const labelClass = "block text-sm font-medium mb-1.5";

/** 基本情報フィールド（氏名・カナ・生年月日・電話番号・メール・住所） */
export function BasicInfoFields({ form, onUpdate, isNew, inputClass }: Props) {
  const ph = (text: string) => (isNew ? text : undefined);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>姓 <span className="text-error">*</span></label>
          <input type="text" value={form.last_name} onChange={(e) => onUpdate("last_name", e.target.value)}
            required placeholder={ph("山田")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>名 <span className="text-error">*</span></label>
          <input type="text" value={form.first_name} onChange={(e) => onUpdate("first_name", e.target.value)}
            required placeholder={ph("花子")} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>セイ</label>
          <input type="text" value={form.last_name_kana} onChange={(e) => onUpdate("last_name_kana", e.target.value)}
            placeholder={ph("ヤマダ")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>メイ</label>
          <input type="text" value={form.first_name_kana} onChange={(e) => onUpdate("first_name_kana", e.target.value)}
            placeholder={ph("ハナコ")} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>生年月日</label>
        <input type="date" value={form.birth_date} onChange={(e) => onUpdate("birth_date", e.target.value)}
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>電話番号</label>
        <input type="tel" value={form.phone} onChange={(e) => onUpdate("phone", e.target.value)}
          placeholder={ph("090-1234-5678")} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>メールアドレス</label>
        <input type="email" value={form.email} onChange={(e) => onUpdate("email", e.target.value)}
          placeholder={ph("example@email.com")} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>住所</label>
        <input type="text" value={form.address} onChange={(e) => onUpdate("address", e.target.value)}
          placeholder={ph("東京都渋谷区...")} className={inputClass} />
      </div>
    </>
  );
}

/** 属性情報フィールド（婚姻状況・お子様・DM送付） */
export function AttributeFields({ form, onUpdate, inputClass }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>婚姻状況</label>
          <select value={form.marital_status} onChange={(e) => onUpdate("marital_status", e.target.value)}
            className={inputClass}>
            {MARITAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>お子様</label>
          <select value={form.has_children} onChange={(e) => onUpdate("has_children", e.target.value)}
            className={inputClass}>
            <option value="">選択してください</option>
            <option value="true">あり</option>
            <option value="false">なし</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>DM送付</label>
        <select value={form.dm_allowed} onChange={(e) => onUpdate("dm_allowed", e.target.value)}
          className={inputClass}>
          <option value="true">可</option>
          <option value="false">不可</option>
        </select>
      </div>
    </>
  );
}

/** 施術関連情報フィールド（身長・体重・アレルギー・施術目標・メモ） */
export function TreatmentInfoFields({ form, onUpdate, isNew, inputClass }: Props) {
  const ph = (text: string) => (isNew ? text : undefined);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>身長 (cm)</label>
          <input type="number" step="0.1" value={form.height_cm}
            onChange={(e) => onUpdate("height_cm", e.target.value)}
            placeholder={ph("160")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>体重 (kg)</label>
          <input type="number" step="0.1" value={form.weight_kg}
            onChange={(e) => onUpdate("weight_kg", e.target.value)}
            placeholder={ph("55")} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>アレルギー・注意事項</label>
        <AutoResizeTextarea value={form.allergies}
          onChange={(e) => onUpdate("allergies", e.target.value)}
          placeholder={ph("アレルギーや施術時の注意事項")} minRows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>施術の最終目標</label>
        <AutoResizeTextarea value={form.treatment_goal}
          onChange={(e) => onUpdate("treatment_goal", e.target.value)}
          placeholder={ph("お客様の施術に対する最終目標")} minRows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>メモ</label>
        <AutoResizeTextarea value={form.notes}
          onChange={(e) => onUpdate("notes", e.target.value)}
          placeholder={ph("自由メモ")} minRows={2} className={inputClass} />
      </div>
    </>
  );
}
