"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import {
  BasicInfoFields,
  AttributeFields,
  TreatmentInfoFields,
} from "@/components/customers/customer-form-fields";
import type { CustomerFormValues } from "@/components/customers/customer-form-fields";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CustomerFormValues>({
    last_name: "",
    first_name: "",
    last_name_kana: "",
    first_name_kana: "",
    birth_date: "",
    phone: "",
    email: "",
    address: "",
    marital_status: "",
    has_children: "",
    dm_allowed: "true",
    height_cm: "",
    weight_kg: "",
    allergies: "",
    treatment_goal: "",
    notes: "",
  });

  const setFormCb = useCallback((val: typeof form) => setForm(val), []);
  const { clearDraft, draftRestored, dismissDraftBanner } = useFormDraft("customer-new", form, setFormCb);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("ログインセッションが切れました");
      setLoading(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) {
      setError("サロン情報が見つかりません");
      setLoading(false);
      return;
    }

    const { data: newCustomer, error } = await supabase.from("customers").insert({
      salon_id: salon.id,
      last_name: form.last_name,
      first_name: form.first_name,
      last_name_kana: form.last_name_kana || null,
      first_name_kana: form.first_name_kana || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      marital_status: form.marital_status || null,
      has_children: form.has_children === "" ? null : form.has_children === "true",
      dm_allowed: form.dm_allowed === "true",
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      allergies: form.allergies || null,
      treatment_goal: form.treatment_goal || null,
      notes: form.notes || null,
    }).select("id").single<{ id: string }>();

    if (error || !newCustomer) {
      setError("登録に失敗しました。もう一度お試しください");
      setLoading(false);
      return;
    }

    clearDraft();
    setFlashToast("顧客を登録しました");
    router.push(`/customers/${newCustomer.id}`);
    router.refresh();
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  const fieldProps = { form, onUpdate: updateField, isNew: true, inputClass };

  return (
    <div className="space-y-4">
      <PageHeader
        title="顧客を追加"
        breadcrumbs={[
          { label: "顧客一覧", href: "/customers" },
          { label: "新規登録" },
        ]}
      />

      {draftRestored && (
        <div className="bg-accent/10 text-accent text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>前回の入力内容を復元しました</span>
          <button type="button" onClick={dismissDraftBanner} className="text-xs underline">閉じる</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} />}

        {/* 基本情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">基本情報</h3>
          <BasicInfoFields {...fieldProps} />
        </div>

        {/* 詳細情報（折りたたみ） */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <CollapsibleSection label="詳細情報を追加（任意）">
            <h4 className="font-medium text-xs text-text-light uppercase tracking-wide">属性情報</h4>
            <AttributeFields {...fieldProps} />

            <h4 className="font-medium text-xs text-text-light uppercase tracking-wide pt-2">施術関連情報</h4>
            <TreatmentInfoFields {...fieldProps} />
          </CollapsibleSection>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
