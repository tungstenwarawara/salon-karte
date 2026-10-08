import { describe, it, expect } from "vitest";
import {
  resolveHiddenCustomerInfoFields,
  omitHiddenCustomerInfoFields,
} from "@/lib/counseling-customer-info";

const BODY_AND_FAMILY = ["marital_status", "has_children", "height_cm", "weight_kg"];

describe("resolveHiddenCustomerInfoFields", () => {
  it("未設定のネイルサロンは体型・家族構成を聞かない", () => {
    expect(resolveHiddenCustomerInfoFields({}, "nail")).toEqual(BODY_AND_FAMILY);
  });

  it("未設定のまつ毛・ヘアサロンも体型・家族構成を聞かない", () => {
    expect(resolveHiddenCustomerInfoFields({}, "eyelash")).toEqual(BODY_AND_FAMILY);
    expect(resolveHiddenCustomerInfoFields({}, "hair")).toEqual(BODY_AND_FAMILY);
  });

  it("未設定のエステ・業種不明のサロンは従来どおり全項目を聞く", () => {
    expect(resolveHiddenCustomerInfoFields({}, "esthetic")).toEqual([]);
    expect(resolveHiddenCustomerInfoFields({}, "bodycare")).toEqual([]);
    expect(resolveHiddenCustomerInfoFields({}, null)).toEqual([]);
    expect(resolveHiddenCustomerInfoFields({}, undefined)).toEqual([]);
  });

  it("テンプレートで選ばれていれば業種の既定より優先する", () => {
    expect(resolveHiddenCustomerInfoFields({ hiddenCustomerInfoFields: ["allergies"] }, "nail")).toEqual(["allergies"]);
  });

  it("空配列は「全項目を聞く」という明示的な選択として扱う", () => {
    expect(resolveHiddenCustomerInfoFields({ hiddenCustomerInfoFields: [] }, "nail")).toEqual([]);
  });

  it("未知の項目名や不正な値は捨てる（JSONB由来のため）", () => {
    expect(
      resolveHiddenCustomerInfoFields({ hiddenCustomerInfoFields: ["last_name", "height_cm", 1, null] }, "esthetic"),
    ).toEqual(["height_cm"]);
  });

  it("配列でない値は未設定として扱う", () => {
    expect(resolveHiddenCustomerInfoFields({ hiddenCustomerInfoFields: "height_cm" }, "nail")).toEqual(BODY_AND_FAMILY);
  });

  it("既定の配列を呼び出し側が変更しても次の結果に影響しない", () => {
    resolveHiddenCustomerInfoFields({}, "nail").push("address");
    expect(resolveHiddenCustomerInfoFields({}, "nail")).toEqual(BODY_AND_FAMILY);
  });
});

describe("omitHiddenCustomerInfoFields", () => {
  const columns = {
    last_name: "山田",
    first_name: "花子",
    height_cm: null,
    allergies: null,
    dm_allowed: true,
  };

  it("非表示の項目だけを取り除き、お名前は残す", () => {
    expect(omitHiddenCustomerInfoFields(columns, ["height_cm", "allergies"])).toEqual({
      last_name: "山田",
      first_name: "花子",
      dm_allowed: true,
    });
  });

  it("非表示の項目がなければ全項目をそのまま返す", () => {
    expect(omitHiddenCustomerInfoFields(columns, [])).toEqual(columns);
  });
});
