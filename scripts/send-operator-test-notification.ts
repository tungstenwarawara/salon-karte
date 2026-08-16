/**
 * 運営者向け課金通知の疎通テスト
 *
 * 目的: 本物の Stripe イベントを待たずに、以下3点を確認する
 *   1. メールテンプレートが壊れていないか
 *   2. Resend が受理するか
 *   3. OPERATOR_NOTIFICATION_EMAIL 宛に実際に届くか（迷惑メール判定を含む）
 *
 * このスクリプトは Stripe にもデータベースにも一切アクセスしない。
 * 送信先は OPERATOR_NOTIFICATION_EMAIL の1件のみ。
 *
 * 確認できないこと:
 *   - Stripe の Webhook が実際にこの通知を呼ぶか
 *   - Vercel 上で after() が最後まで走るか
 *   いずれも本物のイベントが起きるまで検証不能。
 *
 * 使い方:
 *   npx tsx scripts/send-operator-test-notification.ts
 *   npx tsx scripts/send-operator-test-notification.ts you@example.com
 *
 * 宛先は引数 > OPERATOR_NOTIFICATION_EMAIL(.env.local) の順で解決する。
 * Vercel にだけ設定している場合は、その値を引数で渡すこと。
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { Resend } from "resend";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { buildOperatorBillingEmail } from "../src/lib/email/templates";

/** メールアドレスを伏せて表示する（ログに実アドレスを残さない） */
function maskEmail(address: string): string {
  const [local, domain] = address.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

async function main() {
  const to = process.argv[2] ?? process.env.OPERATOR_NOTIFICATION_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "サロンカルテ <support@salonkarte.com>";

  if (!to) {
    console.error(
      "宛先が指定されていません。\n" +
        "Vercel にだけ OPERATOR_NOTIFICATION_EMAIL を設定している場合は、\n" +
        "その値を引数で渡してください:\n" +
        "  npx tsx scripts/send-operator-test-notification.ts you@example.com\n" +
        "毎回渡すのが面倒なら .env.local にも同じ値を追加してください。"
    );
    process.exit(1);
  }

  // プレースホルダをそのまま貼られたケースを Resend に投げる前に弾く
  if (!/^[\x20-\x7E]+@[\x20-\x7E]+\.[\x20-\x7E]+$/.test(to)) {
    console.error(
      `宛先「${to}」はメールアドレスの形式になっていません。\n` +
        "実際のアドレスに置き換えて実行してください:\n" +
        "  npx tsx scripts/send-operator-test-notification.ts owner@example.com"
    );
    process.exit(1);
  }

  if (!apiKey) {
    console.error("RESEND_API_KEY が .env.local に未設定です。");
    process.exit(1);
  }

  // 本番と同じテンプレートを使う。ただし本物の成約と誤認しないよう
  // サロン名で明示する
  const { subject, html } = buildOperatorBillingEmail({
    kind: "subscribed",
    salonName: "疎通テスト（実際の成約ではありません）",
    salonId: "00000000-0000-0000-0000-000000000000",
    occurredAt: new Date().toISOString(),
  });

  console.log(`送信先: ${maskEmail(to)}`);
  console.log(`件名: ${subject}`);
  console.log(`HTML: ${html.length} 文字`);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error("送信失敗:", error);
    process.exit(1);
  }

  console.log(`送信成功。Resend message id: ${data?.id}`);
  console.log(
    "受信トレイと迷惑メールフォルダの両方を確認してください。\n" +
      "迷惑メールに入っていた場合は、本物の成約通知も同じ扱いになります。"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
