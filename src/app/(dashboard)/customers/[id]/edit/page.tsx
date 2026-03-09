"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  BasicInfoFields,
  AttributeFields,
  TreatmentInfoFields,
} from "@/components/customers/customer-form-fields";
import type { CustomerFormValues } from "@/components/customers/customer-form-fields";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  useEffect(() => {
    const load = async () => {
      const { user, salonId: resolvedSalonId } = await getClientAuth();
      if (!user || !resolvedSalonId) return;
      setSalonId(resolvedSalonId);

      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("id, last_name, first_name, last_name_kana, first_name_kana, birth_date, phone, email, address, marital_status, has_children, dm_allowed, height_cm, weight_kg, allergies, treatment_goal, notes")
        .eq("id", id)
        .eq("salon_id", resolvedSalonId)
        .single<Customer>();
      if (data) {
        setForm({
          last_name: data.last_name,
          first_name: data.first_name,
          last_name_kana: data.last_name_kana ?? "",
          first_name_kana: data.first_name_kana ?? "",
          birth_date: data.birth_date ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          marital_status: data.marital_status ?? "",
          has_children: data.has_children === null ? "" : data.has_children ? "true" : "false",
          dm_allowed: data.dm_allowed === false ? "false" : "true",
          height_cm: data.height_cm !== null ? String(data.height_cm) : "",
          weight_kg: data.weight_kg !== null ? String(data.weight_kg) : "",
          allergies: data.allergies ?? "",
          treatment_goal: data.treatment_goal ?? "",
          notes: data.notes ?? "",
        });
      }
    };
    load();
  }, [id]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({
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
        height_cm: form.height_cm && !isNaN(parseFloat(form.height_cm)) ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg && !isNaN(parseFloat(form.weight_kg)) ? parseFloat(form.weight_kg) : null,
        allergies: form.allergies || null,
        treatment_goal: form.treatment_goal || null,
        notes: form.notes || null,
      })
      .eq("id", id)
      .eq("salon_id", salonId);

    if (error) {
      setError(`更新に失敗しました: ${error.message}`);
      setLoading(false);
      return;
    }

    setFlashToast("顧客情報を更新しました");
    router.push(`/customers/${id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);

    const supabase = createClient();

    // この顧客の施術写真をストレージからクリーンアップ
    const { data: records } = await supabase
      .from("treatment_records")
      .select("id")
      .eq("customer_id", id)
      .eq("salon_id", salonId);

    if (records && records.length > 0) {
      const recordIds = records.map((r) => r.id);
      const { data: photos } = await supabase
        .from("treatment_photos")
        .select("storage_path")
        .in("treatment_record_id", recordIds);

      if (photos && photos.length > 0) {
        const paths = photos.map((p) => p.storage_path);
        await supabase.storage.from("treatment-photos").remove(paths);
      }
    }

    const { error } = await supabase.from("customers").delete().eq("id", id).eq("salon_id", salonId);

    if (error) {
      setError(`削除に失敗しました: ${error.message}`);
      setDeleting(false);
      return;
    }

    setFlashToast("顧客を削除しました");
    router.push("/customers");
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  const fieldProps = { form, onUpdate: updateField, inputClass };

  return (
    <div className="space-y-4">
      <PageHeader
        title="顧客情報を編集"
        breadcrumbs={[
          { label: "顧客一覧", href: "/customers" },
          { label: form.last_name ? `${form.last_name} ${form.first_name}` : "顧客", href: `/customers/${id}` },
          { label: "編集" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} />}

        {/* 基本情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">基本情報</h3>
          <BasicInfoFields {...fieldProps} />
        </div>

        {/* 属性情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">属性情報</h3>
          <AttributeFields {...fieldProps} />
        </div>

        {/* 施術関連情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">施術関連情報</h3>
          <TreatmentInfoFields {...fieldProps} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            キャンセル
          </button>
          <SubmitButton loading={loading} className="flex-1" />
        </div>
      </form>

      {/* 削除 */}
      <div className="bg-surface border border-error/20 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
            <p className="text-sm font-medium text-red-800">この顧客を削除しますか？</p>
            <p className="text-xs text-red-700">顧客情報と関連する全ての施術記録・写真が削除されます。この操作は取り消せません。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 text-sm py-2.5 rounded-xl border border-border hover:bg-background transition-colors min-h-[44px]">キャンセル</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 text-sm py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px]">{deleting ? "削除中..." : "削除する"}</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-light mb-3">
              顧客情報と関連する全ての施術記録が削除されます。この操作は取り消せません。
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors min-h-[48px]"
            >
              この顧客を削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
