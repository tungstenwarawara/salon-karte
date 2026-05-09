import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// テストプロセス側でも .env.local を読み込む（admin client / SUPABASE_SERVICE_ROLE_KEY 用）
loadEnv({ path: resolve(__dirname, ".env.local") });

/**
 * Playwright 設定
 *
 * 設計方針:
 * - workers: 1 — テストサロン (00000000-...0001) を全テストで共有するため、
 *   並列実行でデータが衝突しないよう逐次実行に固定。
 * - storageState — fixtures/auth.ts でログイン状態を1度だけ作り、
 *   各テストはセットアップ済み状態から開始（ログイン手間を省く）。
 * - 2 projects — Chromium デスクトップ + iPhone 14 モバイル。
 *   salon-karte はモバイルメインなので両方走らせる。
 *
 * 安全性:
 * - テストは原則「読み取り + フォーム入力 → 送信 → 検証 → 削除」のクリーンアップ責務を持つ。
 * - データを残すテストは spec ごとに seed-test-data.ts --reset で初期化を明示する。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },

  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "mobile-iphone",
      use: {
        ...devices["iPhone 14"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
