import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDateJa, formatDateShort, formatDateRelative } from "@/lib/format";

describe("formatDateJa", () => {
  it("ISO日付を日本語形式に変換", () => {
    expect(formatDateJa("2025-01-15")).toBe("2025年1月15日（水）");
  });

  it("各曜日が正しい", () => {
    expect(formatDateJa("2025-01-13")).toBe("2025年1月13日（月）");
    expect(formatDateJa("2025-01-14")).toBe("2025年1月14日（火）");
    expect(formatDateJa("2025-01-15")).toBe("2025年1月15日（水）");
    expect(formatDateJa("2025-01-16")).toBe("2025年1月16日（木）");
    expect(formatDateJa("2025-01-17")).toBe("2025年1月17日（金）");
    expect(formatDateJa("2025-01-18")).toBe("2025年1月18日（土）");
    expect(formatDateJa("2025-01-19")).toBe("2025年1月19日（日）");
  });

  it("月・日のゼロパディングなし（1月→1月、5日→5日）", () => {
    expect(formatDateJa("2025-01-05")).toBe("2025年1月5日（日）");
  });
});

describe("formatDateShort", () => {
  it("年なし短縮形式", () => {
    expect(formatDateShort("2025-01-15")).toBe("1/15（水）");
  });

  it("12月31日", () => {
    expect(formatDateShort("2025-12-31")).toBe("12/31（水）");
  });
});

describe("formatDateRelative", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("今日は「今日」", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    expect(formatDateRelative("2025-01-15")).toBe("今日");
  });

  it("昨日は「昨日」", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    expect(formatDateRelative("2025-01-14")).toBe("昨日");
  });

  it("2〜6日前は「X日前」", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    expect(formatDateRelative("2025-01-13")).toBe("2日前");
    expect(formatDateRelative("2025-01-10")).toBe("5日前");
    expect(formatDateRelative("2025-01-09")).toBe("6日前");
  });

  it("7日以上前は M/D 形式", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    expect(formatDateRelative("2025-01-08")).toBe("1/8");
    expect(formatDateRelative("2024-12-01")).toBe("12/1");
  });

  it("未来の日付は M/D 形式（diffDaysが負）", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    // 未来日は diffDays < 0 なのでどの条件にも当てはまらず M/D
    expect(formatDateRelative("2025-01-20")).toBe("1/20");
  });
});
