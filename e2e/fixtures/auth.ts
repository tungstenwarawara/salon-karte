/**
 * テストサロン認証情報
 *
 * これらは scripts/seed-test-data.ts と一致させること（齟齬があると安全装置に弾かれる）。
 * 本番認証情報を絶対にここに書かない。
 */
export const TEST_SALON_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_OWNER_ID = "00000000-0000-0000-0000-000000000099";
export const TEST_EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL ?? "test-salon@salon-karte.dev";
export const TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ?? "TestSalon2026!";
