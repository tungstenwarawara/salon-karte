/** カウンセリングシートのフィールド型 */
export type FieldType = "text" | "textarea" | "checkbox" | "radio";

/** 個別の質問フィールド */
export type TemplateField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** checkbox / radio の選択肢 */
  options?: string[];
  required?: boolean;
};

/** セクション（1ステップ分） */
export type TemplateSection = {
  id: string;
  title: string;
  /** セクション冒頭の説明文（同意文書等にも利用） */
  description?: string;
  fields: TemplateField[];
};

/** テンプレート全体（salons.counseling_template に保存） */
export type CounselingTemplate = {
  sections: TemplateSection[];
  /**
   * お客様情報ステップで表示しない項目（lib/counseling-customer-info.ts の項目名）。
   * 未設定ならサロンの業種ごとの既定に従う
   */
  hiddenCustomerInfoFields?: string[];
};

/** フォーム回答データ: セクションID → フィールドID → 値 */
export type CounselingResponseData = {
  [sectionId: string]: {
    [fieldId: string]: string | string[];
  };
};
