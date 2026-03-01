"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SetupWizard, type WizardData } from "@/components/setup/setup-wizard";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 既存サロン確認 — あればダッシュボードへリダイレクト
  useEffect(() => {
    const checkExistingSalon = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: staffRecord } = await supabase
        .from("staff")
        .select("salon_id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (staffRecord) {
        router.push("/dashboard");
        return;
      }

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (salon) {
        router.push("/dashboard");
        return;
      }

      setChecking(false);
    };
    checkExistingSalon();
  }, [router]);

  const handleComplete = async (data: WizardData) => {
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ログインセッションが切れました。再度ログインしてください");
      setLoading(false);
      return;
    }

    // 1. サロン作成（営業時間も同時保存）
    const { data: newSalon, error: salonError } = await supabase
      .from("salons")
      .insert({
        owner_id: user.id,
        name: data.salonName,
        phone: data.phone || null,
        address: data.address || null,
        business_hours: data.businessHours,
      })
      .select("id")
      .single();

    if (salonError || !newSalon) {
      setError(`サロン情報の登録に失敗しました: ${salonError?.message || "不明なエラー"}`);
      setLoading(false);
      return;
    }

    // 2. staff レコード（owner）を自動作成
    const { error: staffError } = await supabase.from("staff").insert({
      salon_id: newSalon.id,
      auth_user_id: user.id,
      name: "オーナー",
      email: user.email!,
      role: "owner",
    });

    if (staffError) {
      console.error("staff レコード作成エラー:", staffError);
    }

    // 3. メニュー登録（入力された場合のみ）
    if (data.menuName) {
      const { error: menuError } = await supabase.from("treatment_menus").insert({
        salon_id: newSalon.id,
        name: data.menuName,
        duration_minutes: data.menuDuration,
        price: data.menuPrice ?? 0,
        is_active: true,
      });

      if (menuError) {
        console.error("メニュー登録エラー:", menuError);
      }
    }

    router.push("/dashboard");
  };

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-light text-sm">{loading ? "登録中..." : "読み込み中..."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-error/10 text-error text-sm rounded-lg p-3 max-w-sm w-full mx-4 animate-fade-in-up">
          {error}
        </div>
      )}
      <SetupWizard onComplete={handleComplete} />
    </>
  );
}
