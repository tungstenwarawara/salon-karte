import { describe, it, expect } from "vitest";
import {
  getLimit,
  isAtLimit,
  isApproachingLimit,
  getRemainingQuota,
  getUsageRatio,
  canUseFeature,
  getPlanLabel,
  getLimitLabel,
  getFeatureLabel,
} from "@/lib/plan";

describe("getLimit", () => {
  it("free: 顧客 50, カルテ 100, 予約 30", () => {
    expect(getLimit("free", "customers")).toBe(50);
    expect(getLimit("free", "records")).toBe(100);
    expect(getLimit("free", "appointmentsThisMonth")).toBe(30);
  });

  it("standard: すべて Infinity", () => {
    expect(getLimit("standard", "customers")).toBe(Infinity);
    expect(getLimit("standard", "records")).toBe(Infinity);
    expect(getLimit("standard", "appointmentsThisMonth")).toBe(Infinity);
  });
});

describe("isAtLimit", () => {
  it("free: 上限到達済みなら true", () => {
    expect(isAtLimit("free", "customers", 50)).toBe(true);
    expect(isAtLimit("free", "customers", 51)).toBe(true);
    expect(isAtLimit("free", "records", 100)).toBe(true);
  });

  it("free: 上限未満なら false", () => {
    expect(isAtLimit("free", "customers", 49)).toBe(false);
    expect(isAtLimit("free", "customers", 0)).toBe(false);
  });

  it("standard: 何件あっても false", () => {
    expect(isAtLimit("standard", "customers", 99999)).toBe(false);
    expect(isAtLimit("standard", "records", 1000000)).toBe(false);
  });
});

describe("isApproachingLimit", () => {
  it("free: 80% 到達で true", () => {
    expect(isApproachingLimit("free", "customers", 40)).toBe(true); // 50*0.8 = 40
    expect(isApproachingLimit("free", "records", 80)).toBe(true); // 100*0.8 = 80
    expect(isApproachingLimit("free", "appointmentsThisMonth", 24)).toBe(true); // 30*0.8 = 24
  });

  it("free: 80% 未満なら false", () => {
    expect(isApproachingLimit("free", "customers", 39)).toBe(false);
    expect(isApproachingLimit("free", "customers", 0)).toBe(false);
  });

  it("free: 上限到達済みは false（既に「警告中」ではなく「ブロック中」）", () => {
    expect(isApproachingLimit("free", "customers", 50)).toBe(false);
    expect(isApproachingLimit("free", "customers", 100)).toBe(false);
  });

  it("standard: 常に false", () => {
    expect(isApproachingLimit("standard", "customers", 99999)).toBe(false);
  });
});

describe("getRemainingQuota", () => {
  it("free: 残り枠を計算", () => {
    expect(getRemainingQuota("free", "customers", 30)).toBe(20);
    expect(getRemainingQuota("free", "customers", 50)).toBe(0);
    expect(getRemainingQuota("free", "customers", 60)).toBe(0); // マイナスにならない
  });

  it("standard: Infinity", () => {
    expect(getRemainingQuota("standard", "customers", 999)).toBe(Infinity);
  });
});

describe("getUsageRatio", () => {
  it("free: 0〜1 の比率", () => {
    expect(getUsageRatio("free", "customers", 0)).toBe(0);
    expect(getUsageRatio("free", "customers", 25)).toBe(0.5);
    expect(getUsageRatio("free", "customers", 50)).toBe(1);
    expect(getUsageRatio("free", "customers", 100)).toBe(1); // 1を超えない
  });

  it("standard: 常に 0", () => {
    expect(getUsageRatio("standard", "customers", 99999)).toBe(0);
  });
});

describe("canUseFeature", () => {
  it("free: 全機能 不可", () => {
    expect(canUseFeature("free", "photoStorage")).toBe(false);
    expect(canUseFeature("free", "lineIntegration")).toBe(false);
    expect(canUseFeature("free", "counselingSheet")).toBe(false);
    expect(canUseFeature("free", "salesAnalytics")).toBe(false);
  });

  it("standard: 全機能 可", () => {
    expect(canUseFeature("standard", "photoStorage")).toBe(true);
    expect(canUseFeature("standard", "lineIntegration")).toBe(true);
    expect(canUseFeature("standard", "counselingSheet")).toBe(true);
    expect(canUseFeature("standard", "salesAnalytics")).toBe(true);
  });
});

describe("ラベル取得", () => {
  it("プラン名", () => {
    expect(getPlanLabel("free")).toBe("おためしプラン");
    expect(getPlanLabel("standard")).toBe("スタンダードプラン");
  });

  it("制限項目", () => {
    expect(getLimitLabel("customers")).toBe("顧客");
    expect(getLimitLabel("records")).toBe("カルテ");
    expect(getLimitLabel("appointmentsThisMonth")).toBe("予約（今月）");
  });

  it("機能項目", () => {
    expect(getFeatureLabel("photoStorage")).toBe("施術写真");
    expect(getFeatureLabel("lineIntegration")).toBe("LINE連携");
    expect(getFeatureLabel("counselingSheet")).toBe("カウンセリングシート");
    expect(getFeatureLabel("salesAnalytics")).toBe("売上分析");
  });
});
