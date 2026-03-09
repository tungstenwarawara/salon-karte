/**
 * 集客 PDCA 週次レポート生成スクリプト
 *
 * GA4 Data API からデータを取得し、Markdown レポートを出力する。
 * GitHub Actions の週次ワークフローから呼び出される。
 *
 * 使い方:
 *   npx tsx scripts/acquisition-report.ts
 *   npx tsx scripts/acquisition-report.ts --period=monthly
 *
 * 環境変数:
 *   GA4_PROPERTY_ID       — GA4 プロパティ ID（例: "properties/123456789"）
 *   GA4_CREDENTIALS_JSON  — Google サービスアカウントの JSON キー（文字列）
 *   SUPABASE_URL          — Supabase プロジェクト URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase サービスロールキー
 *
 * GA4 Data API が未設定の場合は Supabase のサインアップ数のみでレポートを生成する。
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------- 設定 ----------

const PERIOD = process.argv.includes("--period=monthly") ? "monthly" : "weekly";
const DAYS = PERIOD === "monthly" ? 30 : 7;

// GA4_PROPERTY_ID は "properties/123456789" 形式が必要。
// 数字のみ（例: "123456789"）が渡された場合は自動で補完する。
const rawGA4PropertyId = process.env.GA4_PROPERTY_ID;
const GA4_PROPERTY_ID = rawGA4PropertyId
  ? rawGA4PropertyId.startsWith("properties/")
    ? rawGA4PropertyId
    : `properties/${rawGA4PropertyId}`
  : undefined;
const GA4_CREDENTIALS_JSON = process.env.GA4_CREDENTIALS_JSON;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------- 日付ユーティリティ ----------

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------- GA4 Data API ----------

type GA4Report = {
  pageviews: number;
  users: number;
  topPages: { path: string; views: number }[];
  topReferrers: { source: string; users: number }[];
  events: { name: string; count: number }[];
};

async function fetchGA4Report(): Promise<GA4Report | null> {
  if (!GA4_PROPERTY_ID || !GA4_CREDENTIALS_JSON) {
    console.log("⚠️  GA4 環境変数が未設定のため、GA4 データはスキップします");
    return null;
  }

  try {
    // Google Auth の動的インポート（インストール済みの場合のみ）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleAuth } = await import(/* webpackIgnore: true */ "google-auth-library" as string);
    const credentials = JSON.parse(GA4_CREDENTIALS_JSON);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const startDate = formatDate(daysAgo(DAYS));
    const endDate = formatDate(daysAgo(1));

    // ページビュー + ユーザー数
    const overviewRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
          ],
        }),
      }
    );
    const overview = await overviewRes.json();
    const row0 = overview.rows?.[0]?.metricValues || [];
    const pageviews = parseInt(row0[0]?.value || "0");
    const users = parseInt(row0[1]?.value || "0");

    // トップページ
    const pagesRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
        }),
      }
    );
    const pagesData = await pagesRes.json();
    const topPages = (pagesData.rows || []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      path: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
    }));

    // トップ流入元
    const refRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionSource" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 10,
        }),
      }
    );
    const refData = await refRes.json();
    const topReferrers = (refData.rows || []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      source: r.dimensionValues[0].value,
      users: parseInt(r.metricValues[0].value),
    }));

    // カスタムイベント
    const eventsRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: {
                values: [
                  "cta_click",
                  "signup_start",
                  "signup_complete",
                  "onboarding_complete",
                  "first_record",
                  "blog_read",
                ],
              },
            },
          },
        }),
      }
    );
    const eventsData = await eventsRes.json();
    const events = (eventsData.rows || []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      name: r.dimensionValues[0].value,
      count: parseInt(r.metricValues[0].value),
    }));

    return { pageviews, users, topPages, topReferrers, events };
  } catch (err) {
    console.error("GA4 API エラー:", err);
    return null;
  }
}

// ---------- Supabase データ ----------

type SupabaseMetrics = {
  totalSalons: number;
  newSalonsThisPeriod: number;
  totalRecords: number;
  newRecordsThisPeriod: number;
  activeSalons: number;
};

async function fetchSupabaseMetrics(): Promise<SupabaseMetrics | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("⚠️  Supabase 環境変数が未設定のため、DB メトリクスはスキップします");
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const periodStart = formatDate(daysAgo(DAYS));

  const [salonsAll, salonsNew, recordsAll, recordsNew, activeSalons] = await Promise.all([
    supabase.from("salons").select("id", { count: "exact", head: true }),
    supabase.from("salons").select("id", { count: "exact", head: true }).gte("created_at", periodStart),
    supabase.from("treatment_records").select("id", { count: "exact", head: true }),
    supabase.from("treatment_records").select("id", { count: "exact", head: true }).gte("created_at", periodStart),
    // 今期間にカルテ or 予約を作ったサロン = アクティブ
    supabase.from("treatment_records").select("salon_id").gte("created_at", periodStart),
  ]);

  const uniqueActiveSalons = new Set(
    (activeSalons.data || []).map((r: { salon_id: string }) => r.salon_id)
  ).size;

  return {
    totalSalons: salonsAll.count || 0,
    newSalonsThisPeriod: salonsNew.count || 0,
    totalRecords: recordsAll.count || 0,
    newRecordsThisPeriod: recordsNew.count || 0,
    activeSalons: uniqueActiveSalons,
  };
}

// ---------- ブログ記事数 ----------

function countBlogPosts(): number {
  const blogDir = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(blogDir)) return 0;
  return fs.readdirSync(blogDir).filter((f) => f.endsWith(".md")).length;
}

// ---------- レポート生成 ----------

function generateReport(
  ga4: GA4Report | null,
  db: SupabaseMetrics | null,
  blogCount: number,
): string {
  const now = new Date();
  const periodLabel = PERIOD === "monthly" ? "月次" : "週次";
  const startDate = formatDate(daysAgo(DAYS));
  const endDate = formatDate(daysAgo(1));

  let md = `# 集客 PDCA ${periodLabel}レポート\n\n`;
  md += `> 期間: ${startDate} 〜 ${endDate}\n`;
  md += `> 生成日時: ${now.toISOString()}\n\n`;
  md += `---\n\n`;

  // KPI サマリー
  md += `## KPI サマリー\n\n`;
  md += `| 指標 | 今期間 | 目標（3ヶ月） | 目標（6ヶ月） |\n`;
  md += `|------|--------|-------------|-------------|\n`;

  if (ga4) {
    md += `| LP + ブログ PV | ${ga4.pageviews} | 500/月 | 3,000/月 |\n`;
    md += `| ユニークユーザー | ${ga4.users} | 100/月 | 500/月 |\n`;
  } else {
    md += `| LP + ブログ PV | (GA4未設定) | 500/月 | 3,000/月 |\n`;
    md += `| ユニークユーザー | (GA4未設定) | 100/月 | 500/月 |\n`;
  }

  if (db) {
    md += `| サインアップ数（累計） | ${db.totalSalons} | 5 | 15 |\n`;
    md += `| 今期間の新規サロン | ${db.newSalonsThisPeriod} | — | — |\n`;
    md += `| アクティブサロン数 | ${db.activeSalons} | 3 | 5 |\n`;
  } else {
    md += `| サインアップ数 | (DB未接続) | 5 | 15 |\n`;
  }

  md += `| 公開ブログ記事数 | ${blogCount} | 5 | 10 |\n`;
  md += `\n`;

  // ファネル
  if (ga4 && ga4.events.length > 0) {
    md += `## 集客ファネル\n\n`;
    md += `| ステージ | イベント数 |\n`;
    md += `|---------|----------|\n`;

    const eventMap = new Map(ga4.events.map((e) => [e.name, e.count]));
    const funnel = [
      ["CTA クリック", "cta_click"],
      ["サインアップ開始", "signup_start"],
      ["サインアップ完了", "signup_complete"],
      ["オンボーディング完了", "onboarding_complete"],
      ["初回カルテ作成", "first_record"],
      ["ブログ精読 (75%)", "blog_read"],
    ] as const;

    for (const [label, key] of funnel) {
      md += `| ${label} | ${eventMap.get(key) ?? 0} |\n`;
    }
    md += `\n`;
  }

  // トップページ
  if (ga4 && ga4.topPages.length > 0) {
    md += `## ページ別 PV（上位10）\n\n`;
    md += `| パス | PV |\n`;
    md += `|------|----|\n`;
    for (const p of ga4.topPages) {
      md += `| ${p.path} | ${p.views} |\n`;
    }
    md += `\n`;
  }

  // 流入元
  if (ga4 && ga4.topReferrers.length > 0) {
    md += `## 流入元（上位10）\n\n`;
    md += `| ソース | ユーザー数 |\n`;
    md += `|--------|----------|\n`;
    for (const r of ga4.topReferrers) {
      md += `| ${r.source} | ${r.users} |\n`;
    }
    md += `\n`;
  }

  // DB 詳細
  if (db) {
    md += `## プロダクト利用状況\n\n`;
    md += `| 指標 | 値 |\n`;
    md += `|------|----|\n`;
    md += `| サロン数（累計） | ${db.totalSalons} |\n`;
    md += `| 今期間の新規サロン | ${db.newSalonsThisPeriod} |\n`;
    md += `| カルテ数（累計） | ${db.totalRecords} |\n`;
    md += `| 今期間の新規カルテ | ${db.newRecordsThisPeriod} |\n`;
    md += `| アクティブサロン | ${db.activeSalons} |\n`;
    md += `\n`;
  }

  // アクション提案
  md += `## 次のアクション提案\n\n`;
  md += `> 以下は自動生成の仮提案です。Claude Code との週次レビューで具体化してください。\n\n`;

  if (blogCount < 5) {
    md += `- [ ] ブログ記事を追加する（現在 ${blogCount} 本 → 目標 5 本）\n`;
  }
  if (ga4 && ga4.pageviews < 100) {
    md += `- [ ] PV が低い → SEO 記事の内部リンク強化、SNS でのシェアを検討\n`;
  }
  if (ga4) {
    const ctaClicks = ga4.events.find((e) => e.name === "cta_click")?.count ?? 0;
    const signupStarts = ga4.events.find((e) => e.name === "signup_start")?.count ?? 0;
    if (ctaClicks > 0 && signupStarts === 0) {
      md += `- [ ] CTA クリックあり → サインアップ0 = /signup ページに課題あり\n`;
    }
  }
  if (db && db.newSalonsThisPeriod === 0) {
    md += `- [ ] 今期間の新規サロン 0 → テスターへの紹介依頼、SEO 記事公開を加速\n`;
  }

  md += `\n---\n\n`;
  md += `*このレポートは \`scripts/acquisition-report.ts\` で自動生成されました*\n`;

  return md;
}

// ---------- メイン ----------

async function main() {
  console.log(`📊 集客レポート生成中（期間: ${DAYS}日間）...`);

  const [ga4, db] = await Promise.all([
    fetchGA4Report(),
    fetchSupabaseMetrics(),
  ]);

  const blogCount = countBlogPosts();
  const report = generateReport(ga4, db, blogCount);

  // docs/reports/ に出力
  const reportsDir = path.join(process.cwd(), "docs", "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `acquisition-${PERIOD}-${formatDate(new Date())}.md`;
  const outputPath = path.join(reportsDir, filename);
  fs.writeFileSync(outputPath, report, "utf-8");

  console.log(`✅ レポート生成完了: ${outputPath}`);

  // stdout にも出力（GitHub Actions の Issue 本文で使う）
  console.log("\n--- レポート内容 ---\n");
  console.log(report);
}

main().catch((err) => {
  console.error("レポート生成失敗:", err);
  process.exit(1);
});
