import { describe, it, expect } from "vitest";
import * as route from "@/app/api/cron/line-reminders/route";

// Vercel Cron は GET でしか呼び出さない。
// 過去に POST のみで実装して空振りしていた障害があるため、ハンドラ形状を固定する。
describe("cron/line-reminders route", () => {
  it("GET ハンドラがエクスポートされている", () => {
    expect(typeof (route as Record<string, unknown>).GET).toBe("function");
  });

  it("POST ハンドラは存在しない（Vercel Cron は GET）", () => {
    expect((route as Record<string, unknown>).POST).toBeUndefined();
  });
});
