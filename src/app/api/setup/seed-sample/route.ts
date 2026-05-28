import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

// POST: オンボーディング体験用のサンプルデータを投入する（オプトイン）
// 投入するもの: 顧客2人 / メニュー1件 / 予約1件（明日） / 施術記録1件（3日前） / カルテメニュー1件
// すべて is_sample=true でマークし、ダッシュボードのバナーから一括削除できる
export async function POST() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  // 既にサンプル投入済みなら何もしない（多重実行ガード）
  const { count: existingSampleCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_sample", true);

  if ((existingSampleCount ?? 0) > 0) {
    return NextResponse.json({ ok: true, alreadySeeded: true });
  }

  // 1. サンプル顧客 2人
  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .insert([
      {
        salon_id: salon.id,
        last_name: "サンプル",
        first_name: "花子",
        last_name_kana: "サンプル",
        first_name_kana: "ハナコ",
        phone: "090-0000-0001",
        notes: "※サンプルデータです。削除ボタンから一括削除できます。",
        is_sample: true,
      },
      {
        salon_id: salon.id,
        last_name: "サンプル",
        first_name: "美咲",
        last_name_kana: "サンプル",
        first_name_kana: "ミサキ",
        phone: "090-0000-0002",
        notes: "※サンプルデータです。",
        is_sample: true,
      },
    ])
    .select("id");

  if (customerError || !customers || customers.length < 2) {
    return NextResponse.json(
      { error: `サンプル顧客の作成に失敗しました: ${customerError?.message ?? "不明なエラー"}` },
      { status: 500 },
    );
  }

  // 2. サンプルメニュー 1件
  const { data: menu, error: menuError } = await supabase
    .from("treatment_menus")
    .insert({
      salon_id: salon.id,
      name: "サンプルメニュー（60分コース）",
      category: "サンプル",
      duration_minutes: 60,
      price: 8000,
      is_active: true,
      is_sample: true,
    })
    .select("id, name, price, duration_minutes")
    .single();

  if (menuError || !menu) {
    return NextResponse.json(
      { error: `サンプルメニューの作成に失敗しました: ${menuError?.message ?? "不明なエラー"}` },
      { status: 500 },
    );
  }

  // 3. サンプル予約 1件（明日の10:00）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const { error: appointmentError } = await supabase.from("appointments").insert({
    salon_id: salon.id,
    customer_id: customers[0].id,
    appointment_date: tomorrowStr,
    start_time: "10:00",
    end_time: "11:00",
    menu_name_snapshot: menu.name,
    status: "scheduled",
    source: "manual",
  });

  if (appointmentError) {
    // 予約失敗は致命的ではない（手前で作った顧客・メニューは残してOK）。ログのみ
    console.error("サンプル予約の作成に失敗:", appointmentError);
  }

  // 4. サンプル施術記録 1件（3日前）
  const past = new Date();
  past.setDate(past.getDate() - 3);
  const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;

  const { data: record, error: recordError } = await supabase
    .from("treatment_records")
    .insert({
      salon_id: salon.id,
      customer_id: customers[1].id,
      treatment_date: pastStr,
      treatment_area: "全身",
      menu_name_snapshot: menu.name,
      menu_id: menu.id,
      record_type: "visit",
      notes_after: "サンプルカルテです。実際の業務ではここに施術内容を記録します。",
    })
    .select("id")
    .single();

  if (recordError || !record) {
    return NextResponse.json(
      { error: `サンプルカルテの作成に失敗しました: ${recordError?.message ?? "不明なエラー"}` },
      { status: 500 },
    );
  }

  // 5. カルテ-メニュー中間レコード（売上集計の対象になる）
  const { error: menuLinkError } = await supabase.from("treatment_record_menus").insert({
    treatment_record_id: record.id,
    menu_id: menu.id,
    menu_name_snapshot: menu.name,
    price_snapshot: menu.price,
    duration_minutes_snapshot: menu.duration_minutes,
    payment_type: "cash",
    sort_order: 0,
  });

  if (menuLinkError) {
    console.error("サンプルカルテメニューの作成に失敗:", menuLinkError);
  }

  return NextResponse.json({ ok: true, alreadySeeded: false });
}

// DELETE: サンプルデータを一括削除する
// customers の ON DELETE CASCADE で treatment_records / appointments / purchases なども連鎖削除される
// menus は treatment_record_menus.menu_id が ON DELETE SET NULL のため単独で削除可能
export async function DELETE() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  // 1. サンプル顧客削除（カルテ・予約・物販は CASCADE で連鎖削除）
  const { error: customerError } = await supabase
    .from("customers")
    .delete()
    .eq("salon_id", salon.id)
    .eq("is_sample", true);

  if (customerError) {
    return NextResponse.json(
      { error: `サンプル顧客の削除に失敗しました: ${customerError.message}` },
      { status: 500 },
    );
  }

  // 2. サンプルメニュー削除
  const { error: menuError } = await supabase
    .from("treatment_menus")
    .delete()
    .eq("salon_id", salon.id)
    .eq("is_sample", true);

  if (menuError) {
    return NextResponse.json(
      { error: `サンプルメニューの削除に失敗しました: ${menuError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
