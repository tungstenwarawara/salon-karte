import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import {
  buildDay3NoCustomerEmail,
  buildDay7NoRecordEmail,
  buildDay14NoSecondRecordEmail,
} from "@/lib/email/templates";

type EmailType = "day3_no_customer" | "day7_no_record" | "day14_no_second_record";

// GET: 日次オンボーディングメール送信
// Vercel Cron が呼ぶ。`CRON_SECRET` で認証。
// 各サロンに対し email_send_logs(salon_id, email_type) UNIQUE で二重送信防止
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません");
    Sentry.captureMessage("CRON_SECRET 未設定（onboarding-emails）", { level: "error", tags: { feature: "cron" } });
    return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const resend = getResendClient();
  if (!resend) {
    // RESEND_API_KEY 未設定時は graceful skip
    return NextResponse.json({ ok: true, skipped: "RESEND_API_KEY 未設定" });
  }

  const adminClient = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://salonkarte.com";

  // 各種日数の閾値となるTIMESTAMPを計算
  const now = new Date();
  const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const day7Cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const day14Cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // 既に送信済みのログを一括取得（後で salon_id で絞る）
  const { data: existingLogs } = await adminClient
    .from("email_send_logs")
    .select("salon_id, email_type")
    .in("email_type", ["day3_no_customer", "day7_no_record", "day14_no_second_record"]);

  const sentSet = new Set((existingLogs ?? []).map((l) => `${l.salon_id}:${l.email_type}`));

  const stats: Record<EmailType, { sent: number; failed: number; skipped: number }> = {
    day3_no_customer: { sent: 0, failed: 0, skipped: 0 },
    day7_no_record: { sent: 0, failed: 0, skipped: 0 },
    day14_no_second_record: { sent: 0, failed: 0, skipped: 0 },
  };

  // テストサロンは除外する（本番ユーザーへの影響だけを計測）
  const TEST_SALON_ID = "00000000-0000-0000-0000-000000000001";

  // === Day 3: 顧客0件 ===
  // 対象: 3〜4日前に作成されたサロン（広めに取って取りこぼし防止）
  const { data: day3Candidates } = await adminClient
    .from("salons")
    .select("id, name, owner_id, created_at")
    .lte("created_at", day3Cutoff)
    .gte("created_at", new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .neq("id", TEST_SALON_ID);

  for (const salon of day3Candidates ?? []) {
    if (sentSet.has(`${salon.id}:day3_no_customer`)) {
      stats.day3_no_customer.skipped++;
      continue;
    }

    const { count: customerCount } = await adminClient
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_sample", false);

    if ((customerCount ?? 0) > 0) {
      stats.day3_no_customer.skipped++;
      continue;
    }

    // オーナーのメールを staff から取得
    const ownerEmail = await getOwnerEmail(adminClient, salon.id);
    if (!ownerEmail) {
      stats.day3_no_customer.skipped++;
      continue;
    }

    const { subject, html } = buildDay3NoCustomerEmail({ salonName: salon.name, appUrl });
    try {
      const { error } = await resend.emails.send({ from: getFromAddress(), to: ownerEmail, subject, html });
      if (error) throw new Error(error.message);
      await adminClient.from("email_send_logs").insert({ salon_id: salon.id, email_type: "day3_no_customer" });
      stats.day3_no_customer.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "送信失敗";
      console.error(`Day3 メール送信エラー (salon: ${salon.id}):`, msg);
      Sentry.captureException(err, { tags: { feature: "onboarding-email" }, extra: { salon_id: salon.id, email_type: "day3_no_customer" } });
      stats.day3_no_customer.failed++;
    }
  }

  // === Day 7: カルテ0件 ===
  const { data: day7Candidates } = await adminClient
    .from("salons")
    .select("id, name, owner_id, created_at")
    .lte("created_at", day7Cutoff)
    .gte("created_at", new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString())
    .neq("id", TEST_SALON_ID);

  for (const salon of day7Candidates ?? []) {
    if (sentSet.has(`${salon.id}:day7_no_record`)) {
      stats.day7_no_record.skipped++;
      continue;
    }

    const { count: recordCount } = await adminClient
      .from("treatment_records")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id);

    if ((recordCount ?? 0) > 0) {
      stats.day7_no_record.skipped++;
      continue;
    }

    const ownerEmail = await getOwnerEmail(adminClient, salon.id);
    if (!ownerEmail) {
      stats.day7_no_record.skipped++;
      continue;
    }

    const { subject, html } = buildDay7NoRecordEmail({ salonName: salon.name, appUrl });
    try {
      const { error } = await resend.emails.send({ from: getFromAddress(), to: ownerEmail, subject, html });
      if (error) throw new Error(error.message);
      await adminClient.from("email_send_logs").insert({ salon_id: salon.id, email_type: "day7_no_record" });
      stats.day7_no_record.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "送信失敗";
      console.error(`Day7 メール送信エラー (salon: ${salon.id}):`, msg);
      Sentry.captureException(err, { tags: { feature: "onboarding-email" }, extra: { salon_id: salon.id, email_type: "day7_no_record" } });
      stats.day7_no_record.failed++;
    }
  }

  // === Day 14: カルテちょうど1件 ===
  const { data: day14Candidates } = await adminClient
    .from("salons")
    .select("id, name, owner_id, created_at")
    .lte("created_at", day14Cutoff)
    .gte("created_at", new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString())
    .neq("id", TEST_SALON_ID);

  for (const salon of day14Candidates ?? []) {
    if (sentSet.has(`${salon.id}:day14_no_second_record`)) {
      stats.day14_no_second_record.skipped++;
      continue;
    }

    const { count: recordCount } = await adminClient
      .from("treatment_records")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id);

    if ((recordCount ?? 0) !== 1) {
      stats.day14_no_second_record.skipped++;
      continue;
    }

    const ownerEmail = await getOwnerEmail(adminClient, salon.id);
    if (!ownerEmail) {
      stats.day14_no_second_record.skipped++;
      continue;
    }

    const { subject, html } = buildDay14NoSecondRecordEmail({ salonName: salon.name, appUrl });
    try {
      const { error } = await resend.emails.send({ from: getFromAddress(), to: ownerEmail, subject, html });
      if (error) throw new Error(error.message);
      await adminClient.from("email_send_logs").insert({ salon_id: salon.id, email_type: "day14_no_second_record" });
      stats.day14_no_second_record.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "送信失敗";
      console.error(`Day14 メール送信エラー (salon: ${salon.id}):`, msg);
      Sentry.captureException(err, { tags: { feature: "onboarding-email" }, extra: { salon_id: salon.id, email_type: "day14_no_second_record" } });
      stats.day14_no_second_record.failed++;
    }
  }

  return NextResponse.json({ ok: true, stats });
}

async function getOwnerEmail(
  client: ReturnType<typeof createAdminClient>,
  salonId: string,
): Promise<string | null> {
  const { data } = await client
    .from("staff")
    .select("email")
    .eq("salon_id", salonId)
    .eq("role", "owner")
    .eq("is_active", true)
    .single();
  return data?.email ?? null;
}
