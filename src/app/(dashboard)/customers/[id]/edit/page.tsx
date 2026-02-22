"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single<{ id: string }>();
      if (!salon) return;
      setSalonId(salon.id);

      const { data } = await supabase
        .from("customers")
        .select("id, last_name, first_name, last_name_kana, first_name_kana, birth_date, phone, email, address, marital_status, has_children, dm_allowed, height_cm, weight_kg, allergies, treatment_goal, notes")
        .eq("id", id)
        .eq("salon_id", salon.id)
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
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        allergies: form.allergies || null,
        treatment_goal: form.treatment_goal || null,
        notes: form.notes || null,
      })
      .eq("id", id)
      .eq("salon_id", salonId);

    if (error) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    setFlashToast("顧客情報を更新しました");
    router.push(`/customers/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm("この顧客情報を削除しますか？施術記録も全て削除されます。")) {
      return;
    }
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
      setError("削除に失敗しました");
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
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>

      {/* 削除 */}
      <div className="bg-surface border border-error/20 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
        <p className="text-sm text-text-light mb-3">
          顧客情報と関連する全ての施術記録が削除されます。この操作は取り消せません。
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {deleting ? "削除中..." : "この顧客を削除"}
        </button>
      </div>
    </div>
  );
}
