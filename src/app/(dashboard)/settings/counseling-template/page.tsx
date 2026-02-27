"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { DEFAULT_COUNSELING_TEMPLATE } from "@/lib/counseling-default-template";
import { AnonymousLinkSection } from "@/components/counseling/anonymous-link-section";
import type { CounselingTemplate } from "@/types/counseling-template";

type Template = {
  id: string;
  name: string;
  template: CounselingTemplate;
  is_default: boolean;
};

export default function CounselingTemplateListPage() {
  const [salonId, setSalonId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const loadTemplates = useCallback(async () => {
    const { user, salonId: sid } = await getClientAuth();
    if (!user || !sid) return;
    setSalonId(sid);

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("counseling_templates")
      .select("id, name, template, is_default")
      .eq("salon_id", sid)
      .order("is_default", { ascending: false });

    if (fetchError) {
      setError(`読み込みに失敗しました: ${fetchError.message}`);
      console.error("テンプレート読み込みエラー:", fetchError);
    } else {
      setTemplates((data ?? []).map((d) => ({
        ...d,
        template: d.template as unknown as CounselingTemplate,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleCreate = async () => {
    if (!salonId || templates.length >= 2) return;
    setCreating(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("counseling_templates")
      .insert({
        salon_id: salonId,
        name: "新しいテンプレート",
        template: JSON.parse(JSON.stringify(DEFAULT_COUNSELING_TEMPLATE)),
        is_default: templates.length === 0,
      });

    if (insertError) {
      setError(`作成に失敗しました: ${insertError.message}`);
      console.error("テンプレート作成エラー:", insertError);
    } else {
      showToast("テンプレートを作成しました");
      await loadTemplates();
    }
    setCreating(false);
  };

  const fieldCount = (t: CounselingTemplate) =>
    t.sections.reduce((sum, s) => sum + s.fields.length, 0);

  if (loading) return null;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="カウンセリングシート設定"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "カウンセリングシート設定" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {/* テンプレート一覧 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">テンプレート</h3>
          {templates.length < 2 && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center disabled:opacity-50"
            >
              {creating ? "作成中..." : "+ テンプレートを追加"}
            </button>
          )}
        </div>

        {templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/settings/counseling-template/${t.id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:bg-background transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.is_default && (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">デフォルト</span>
                      )}
                    </div>
                    <p className="text-xs text-text-light">
                      {t.template.sections.length}セクション・{fieldCount(t.template)}項目
                    </p>
                  </div>
                  <span className="text-text-light text-sm">›</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-text-light text-sm">テンプレートはまだありません</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
            >
              最初のテンプレートを作成する →
            </button>
          </div>
        )}
        <p className="text-xs text-text-light mt-2">テンプレートは最大2つまで作成できます</p>
      </div>

      {/* 新規顧客用リンク発行 */}
      {salonId && (
        <AnonymousLinkSection salonId={salonId} templates={templates} />
      )}
    </div>
  );
}
