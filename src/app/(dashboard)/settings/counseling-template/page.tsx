"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SectionEditor } from "@/components/counseling/section-editor";
import { TemplatePreview } from "@/components/counseling/template-preview";
import { DEFAULT_COUNSELING_TEMPLATE } from "@/lib/counseling-default-template";
import type { CounselingTemplate, TemplateSection } from "@/types/counseling-template";

export default function CounselingTemplatePage() {
  const [salonId, setSalonId] = useState("");
  const [template, setTemplate] = useState<CounselingTemplate | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const loadTemplate = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id, counseling_template")
      .eq("owner_id", user.id)
      .single();

    if (!salon) return;
    setSalonId(salon.id);
    const raw = salon.counseling_template as unknown as CounselingTemplate | null;
    setTemplate(raw ?? structuredClone(DEFAULT_COUNSELING_TEMPLATE));
  }, []);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  const handleSave = async () => {
    if (!salonId || !template) return;
    setSaving(true);
    setError("");

    // 空タイトルのセクションを検証
    const hasEmptyTitle = template.sections.some((s) => !s.title.trim());
    if (hasEmptyTitle) {
      setError("セクション名が空のセクションがあります");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ counseling_template: JSON.parse(JSON.stringify(template)) })
      .eq("id", salonId);

    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`);
      console.error("テンプレート保存エラー:", updateError);
    } else {
      showToast("テンプレートを保存しました");
    }
    setSaving(false);
  };

  const handleReset = () => {
    if (!confirm("デフォルトテンプレートに戻しますか？現在の編集内容は失われます。")) return;
    setTemplate(structuredClone(DEFAULT_COUNSELING_TEMPLATE));
  };

  const updateSection = (idx: number, section: TemplateSection) => {
    if (!template) return;
    const newSections = [...template.sections];
    newSections[idx] = section;
    setTemplate({ ...template, sections: newSections });
  };

  const deleteSection = (idx: number) => {
    if (!template) return;
    if (!confirm("このセクションを削除しますか？")) return;
    setTemplate({ ...template, sections: template.sections.filter((_, i) => i !== idx) });
  };

  const moveSection = (from: number, to: number) => {
    if (!template || to < 0 || to >= template.sections.length) return;
    const newSections = [...template.sections];
    [newSections[from], newSections[to]] = [newSections[to], newSections[from]];
    setTemplate({ ...template, sections: newSections });
  };

  const addSection = () => {
    if (!template) return;
    const newSection: TemplateSection = {
      id: crypto.randomUUID().slice(0, 8),
      title: "",
      fields: [],
    };
    setTemplate({ ...template, sections: [...template.sections, newSection] });
  };

  if (!template) return null;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="カウンセリングシート設定"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "カウンセリングシート設定" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {/* モード切替 */}
      <div className="flex bg-background rounded-xl p-1">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`flex-1 text-sm font-medium rounded-lg py-2 min-h-[44px] transition-colors ${
            !isPreview ? "bg-surface shadow text-text" : "text-text-light"
          }`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`flex-1 text-sm font-medium rounded-lg py-2 min-h-[44px] transition-colors ${
            isPreview ? "bg-surface shadow text-text" : "text-text-light"
          }`}
        >
          プレビュー
        </button>
      </div>

      {isPreview ? (
        <TemplatePreview template={template} />
      ) : (
        <>
          {/* セクション一覧 */}
          <div className="space-y-3">
            {template.sections.map((section, i) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={i}
                onChange={(s) => updateSection(i, s)}
                onDelete={() => deleteSection(i)}
                onMoveUp={() => moveSection(i, i - 1)}
                onMoveDown={() => moveSection(i, i + 1)}
                isFirst={i === 0}
                isLast={i === template.sections.length - 1}
              />
            ))}
          </div>

          {/* セクション追加 */}
          <button
            type="button"
            onClick={addSection}
            className="w-full border-2 border-dashed border-border rounded-xl py-4 text-sm text-accent font-medium hover:border-accent transition-colors min-h-[48px]"
          >
            + セクションを追加
          </button>

          {/* 操作ボタン */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-background border border-border text-sm font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              デフォルトに戻す
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
