import { describe, it, expect } from "vitest";
import { generateCsv } from "@/lib/csv-export";

describe("generateCsv", () => {
  it("ヘッダーと行をCSV文字列に変換", () => {
    const headers = ["名前", "年齢", "メール"];
    const rows = [
      ["山田花子", 30, "hanako@example.com"],
      ["佐藤太郎", 25, "taro@example.com"],
    ];
    const csv = generateCsv(headers, rows);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("名前,年齢,メール");
    expect(lines[1]).toBe("山田花子,30,hanako@example.com");
    expect(lines[2]).toBe("佐藤太郎,25,taro@example.com");
  });

  it("カンマを含む値はダブルクォートで囲む", () => {
    const csv = generateCsv(["商品名", "価格"], [["ローション, 大容量", 3000]]);
    expect(csv).toContain('"ローション, 大容量"');
  });

  it("ダブルクォートを含む値はエスケープ", () => {
    const csv = generateCsv(["メモ"], [['いわゆる"プレミアム"品']]);
    expect(csv).toContain('"いわゆる""プレミアム""品"');
  });

  it("改行を含む値はダブルクォートで囲む", () => {
    const csv = generateCsv(["備考"], [["1行目\n2行目"]]);
    expect(csv).toContain('"1行目\n2行目"');
  });

  it("null/undefined は空文字", () => {
    const csv = generateCsv(["a", "b"], [[null, undefined]]);
    expect(csv.split("\n")[1]).toBe(",");
  });

  it("空の行配列 → ヘッダーのみ", () => {
    const csv = generateCsv(["名前", "年齢"], []);
    expect(csv).toBe("名前,年齢");
  });

  it("数値・boolean もそのまま文字列化", () => {
    const csv = generateCsv(["v"], [[true], [false], [0], [123.45]]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("true");
    expect(lines[2]).toBe("false");
    expect(lines[3]).toBe("0");
    expect(lines[4]).toBe("123.45");
  });
});
