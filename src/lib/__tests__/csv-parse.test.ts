import { describe, it, expect } from "vitest";
import {
  detectColumns,
  splitName,
  parseBirthDate,
  parseDateWithoutYear,
  validateRows,
} from "@/lib/csv-parse";

describe("splitName", () => {
  it("半角スペースで分割", () => {
    expect(splitName("山田 花子")).toEqual({ last: "山田", first: "花子" });
  });

  it("全角スペースで分割", () => {
    expect(splitName("山田　花子")).toEqual({ last: "山田", first: "花子" });
  });

  it("3パーツ以上の場合は2つ目以降を結合", () => {
    expect(splitName("山田 花子 太郎")).toEqual({ last: "山田", first: "花子 太郎" });
  });

  it("スペースなし → 姓のみ・名は空", () => {
    expect(splitName("山田")).toEqual({ last: "山田", first: "" });
  });

  it("前後の空白を除去", () => {
    expect(splitName("  山田 花子  ")).toEqual({ last: "山田", first: "花子" });
  });
});

describe("parseBirthDate", () => {
  it("YYYY/M/D → YYYY-MM-DD", () => {
    expect(parseBirthDate("1990/1/15")).toBe("1990-01-15");
    expect(parseBirthDate("1990/12/31")).toBe("1990-12-31");
  });

  it("YYYY-M-D → YYYY-MM-DD", () => {
    expect(parseBirthDate("1990-1-5")).toBe("1990-01-05");
  });

  it("YYYY年M月D日 → YYYY-MM-DD", () => {
    expect(parseBirthDate("1990年1月15日")).toBe("1990-01-15");
  });

  it("空文字/null相当 → null", () => {
    expect(parseBirthDate("")).toBeNull();
    expect(parseBirthDate("  ")).toBeNull();
  });

  it("解析不能な文字列 → null", () => {
    expect(parseBirthDate("不明")).toBeNull();
    expect(parseBirthDate("abc")).toBeNull();
  });

  it("Excelシリアル値対応", () => {
    // 32874 = 1990-01-15 (Excel基準)
    const result = parseBirthDate("32874");
    expect(result).not.toBeNull();
    // Excelシリアル値の計算を検証
    if (result) {
      const [y] = result.split("-").map(Number);
      expect(y).toBeGreaterThanOrEqual(1900);
      expect(y).toBeLessThanOrEqual(2030);
    }
  });

  it("範囲外の年（1899年以前・2031年以降）→ null", () => {
    expect(parseBirthDate("1899/12/31")).toBeNull();
    expect(parseBirthDate("2031/1/1")).toBeNull();
  });
});

describe("parseDateWithoutYear", () => {
  it("M月D日 形式を解析", () => {
    expect(parseDateWithoutYear("1月15日")).toEqual({ month: 1, day: 15 });
    expect(parseDateWithoutYear("12月31日")).toEqual({ month: 12, day: 31 });
  });

  it("M月D（日なし）も解析", () => {
    expect(parseDateWithoutYear("3月5")).toEqual({ month: 3, day: 5 });
  });

  it("M/D 形式を解析", () => {
    expect(parseDateWithoutYear("1/15")).toEqual({ month: 1, day: 15 });
    expect(parseDateWithoutYear("12/31")).toEqual({ month: 12, day: 31 });
  });

  it("年付き形式は null（parseBirthDateで処理済み）", () => {
    expect(parseDateWithoutYear("2025/1/15")).toBeNull();
    expect(parseDateWithoutYear("2025-01-15")).toBeNull();
  });

  it("空文字/null相当 → null", () => {
    expect(parseDateWithoutYear("")).toBeNull();
    expect(parseDateWithoutYear("  ")).toBeNull();
  });

  it("範囲外の月日 → null", () => {
    expect(parseDateWithoutYear("13月1日")).toBeNull();
    expect(parseDateWithoutYear("0月15日")).toBeNull();
    expect(parseDateWithoutYear("1月32日")).toBeNull();
  });
});

describe("detectColumns", () => {
  it("標準ヘッダーを検出", () => {
    const headers = ["氏名", "フリガナ", "電話番号", "メールアドレス", "生年月日"];
    const { map, missing } = detectColumns(headers);
    expect(map.name).toBe(0);
    expect(map.kana).toBe(1);
    expect(map.phone).toBe(2);
    expect(map.email).toBe(3);
    expect(map.birth_date).toBe(4);
    expect(missing).toHaveLength(0);
  });

  it("別名ヘッダーも検出（名前、TEL、Eメール）", () => {
    const headers = ["名前", "TEL", "Eメール"];
    const { map } = detectColumns(headers);
    expect(map.name).toBe(0);
    expect(map.phone).toBe(1);
    expect(map.email).toBe(2);
  });

  it("氏名列がない場合は missing に含まれる", () => {
    const headers = ["フリガナ", "電話番号"];
    const { missing } = detectColumns(headers);
    expect(missing).toContain("氏名");
  });

  it("空ヘッダー", () => {
    const { map, missing } = detectColumns([]);
    expect(missing).toContain("氏名");
    expect(Object.keys(map)).toHaveLength(0);
  });
});

describe("validateRows", () => {
  const headers = ["氏名", "フリガナ", "電話番号", "メールアドレス", "生年月日"];

  it("正常な行は status: ok", () => {
    const rows = [["山田 花子", "ヤマダ ハナコ", "090-1234-5678", "hanako@example.com", "1990/1/15"]];
    const result = validateRows(headers, rows, []);
    expect(result[0].status).toBe("ok");
    expect(result[0].data.last_name).toBe("山田");
    expect(result[0].data.first_name).toBe("花子");
    expect(result[0].data.phone).toBe("090-1234-5678");
    expect(result[0].data.email).toBe("hanako@example.com");
    expect(result[0].data.birth_date).toBe("1990-01-15");
  });

  it("氏名が空（他フィールドあり）→ status: error", () => {
    // 全セル空は skip 扱いなので、他フィールドに値を入れて氏名空をテスト
    const rows = [["", "", "090-1234-5678", "", ""]];
    const result = validateRows(headers, rows, []);
    expect(result[0].status).toBe("error");
    expect(result[0].messages).toContain("氏名が空です");
  });

  it("スペースなし氏名 → warning（姓のみ登録）", () => {
    const rows = [["山田", "", "", "", ""]];
    const result = validateRows(headers, rows, []);
    expect(result[0].status).toBe("warning");
    expect(result[0].data.last_name).toBe("山田");
    expect(result[0].data.first_name).toBe("");
  });

  it("不正メール → warning", () => {
    const rows = [["山田 花子", "", "", "invalid-email", ""]];
    const result = validateRows(headers, rows, []);
    expect(result[0].status).toBe("warning");
    expect(result[0].messages.some((m) => m.includes("メールアドレスの形式"))).toBe(true);
  });

  it("電話番号で重複検出", () => {
    const existing = [{ last_name: "佐藤", first_name: "太郎", phone: "09012345678", email: null }];
    const rows = [["山田 花子", "", "090-1234-5678", "", ""]];
    const result = validateRows(headers, rows, existing);
    expect(result[0].isDuplicate).toBe(true);
    expect(result[0].duplicateMatch).toContain("電話番号が一致");
  });

  it("同姓同名で重複検出", () => {
    const existing = [{ last_name: "山田", first_name: "花子", phone: null, email: null }];
    const rows = [["山田 花子", "", "", "", ""]];
    const result = validateRows(headers, rows, existing);
    expect(result[0].isDuplicate).toBe(true);
    expect(result[0].duplicateMatch).toContain("同姓同名");
  });

  it("空行は skip", () => {
    const rows = [["", "", "", "", ""]];
    // 全セルが空の場合は skip（氏名空のエラーとは別）
    // 注意: isEmptyRow チェックが先
    const result = validateRows(headers, rows, []);
    expect(result[0].status).toBe("skip");
  });

  it("必須列がない場合は1行エラー", () => {
    const badHeaders = ["フリガナ", "電話番号"];
    const rows = [["ヤマダ", "090-1234-5678"]];
    const result = validateRows(badHeaders, rows, []);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("error");
    expect(result[0].messages[0]).toContain("必須列が見つかりません");
  });

  it("DM可フラグ: ○→true、それ以外→false", () => {
    const headersWithDm = ["氏名", "DM可"];
    const rows = [
      ["山田 花子", "○"],
      ["佐藤 太郎", "×"],
      ["田中 次郎", ""],
    ];
    const result = validateRows(headersWithDm, rows, []);
    expect(result[0].data.dm_allowed).toBe(true);
    expect(result[1].data.dm_allowed).toBe(false);
    expect(result[2].data.dm_allowed).toBe(false);
  });
});
