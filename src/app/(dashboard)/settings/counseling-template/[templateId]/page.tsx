"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SectionEditor } from "@/components/counseling/section-editor";
import { TemplatePreview } from "@/components/counseling/template-preview";
import { DEFAULT_COUNSELING_TEMPLATE } from "@/lib/counseling-default-template";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CounselingTemplate, TemplateSection } from "@/types/counseling-template";

export default function CounselingTemplateEditPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const [salonId, setSalonId] = useState("");
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<CounselingTemplate | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const loadTemplate = useCallback(async () => {
    const { user, salonId: sid } = await getClientAuth();
    if (!user || !sid) return;
    setSalonId(sid);

    const supabase = createClient();
    const { data } = await supabase
      .from("counseling_templates")
      .select("id, name, template, is_default")
      .eq("id", templateId)
      .eq("salon_id", sid)
      .single();

    if (!data) {
      router.push("/settings/counseling-template");
      return;
    }
    setName(data.name);
    setTemplate(data.template as unknown as CounselingTemplate);
    setIsDefault(data.is_default);
  }, [templateId, router]);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  const handleSave = async () => {
    if (!salonId || !template) return;
    setSaving(true);
    setError("");

    const hasEmptyTitle = template.sections.some((s) => !s.title.trim());
    if (hasEmptyTitle) {
      setError("セクション名が空のセクションがあります");
      setSaving(false);
      return;
    }
    if (!name.trim()) {
      setError("テンプレート名を入力してください");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    // デフォルトに設定する場合、他のテンプレートのis_defaultをfalseに
    if (isDefault) {
      await supabase
        .from("counseling_templates")
        .update({ is_default: false })
        .eq("salon_id", salonId)
        .neq("id", templateId);
    }

    const { error: updateError } = await supabase
      .from("counseling_templates")
      .update({
        name: name.trim(),
        template: JSON.parse(JSON.stringify(template)),
        is_default: isDefault,
      })
      .eq("id", templateId)
      .eq("salon_id", salonId);

    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`);
      console.error("テンプレート保存エラー:", updateError);
    } else {
      showToast("テンプレートを保存しました");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    setDeleting(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("counseling_templates")
      .delete()
      .eq("id", templateId)
      .eq("salon_id", salonId);

    if (deleteError) {
      setError(`削除に失敗しました: ${deleteError.message}`);
      console.error("テンプレート削除エラー:", deleteError);
      setDeleting(false);
    } else {
      router.push("/settings/counseling-template");
    }
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
        title="テンプレート編集"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "カウンセリングシート設定", href: "/settings/counseling-template" },
          { label: "テンプレート編集" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {/* テンプレート名 */}
      <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
        <label className="text-sm font-medium">テンプレート名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 初回カウンセリング"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          デフォルトテンプレートに設定
        </label>
      </div>

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

          <button
            type="button"
            onClick={addSection}
            className="w-full border-2 border-dashed border-border rounded-xl py-4 text-sm text-accent font-medium hover:border-accent transition-colors min-h-[48px]"
          >
            + セクションを追加
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-background border border-border text-sm font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              デフォルトに戻す
            </button>
            <SubmitButton type="button" onClick={handleSave} loading={saving} className="flex-1 text-sm" />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full text-sm text-error hover:bg-error/5 rounded-xl py-3 transition-colors min-h-[48px] disabled:opacity-50"
          >
            {deleting ? "削除中..." : "このテンプレートを削除"}
          </button>
        </>
      )}
    </div>
  );
}
