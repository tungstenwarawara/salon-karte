import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// 顧客詳細ページは counseling_sheets を取得し、CounselingSection が
// sheet.template_id で「発行したテンプレート」を引いてラベルを解決する。
// select から template_id が漏れると、別テンプレートで回答されたシートが
// サロン既定テンプレートにフォールバックし、設問がラベルではなく
// フィールドID（例: a1b2c3d4）のまま表示される。
// ビルド・型チェックでは検出できないため、select文字列を直接固定する。
describe("顧客詳細ページの counseling_sheets クエリ", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(dashboard)/customers/[id]/page.tsx"),
    "utf-8"
  );

  it("counseling_sheets の select に template_id が含まれている", () => {
    const match = source.match(
      /\.from\("counseling_sheets"\)\s*\n\s*(?:\/\/[^\n]*\n\s*)*\.select\("([^"]+)"\)/
    );
    expect(match, "counseling_sheets の .select() が見つからない").not.toBeNull();
    const columns = match![1].split(",").map((c) => c.trim());
    expect(columns).toContain("template_id");
  });

  it("回答表示に必要なカラムが揃っている", () => {
    const match = source.match(
      /\.from\("counseling_sheets"\)\s*\n\s*(?:\/\/[^\n]*\n\s*)*\.select\("([^"]+)"\)/
    );
    const columns = match![1].split(",").map((c) => c.trim());
    for (const required of ["id", "status", "responses", "submitted_at", "token", "expires_at"]) {
      expect(columns).toContain(required);
    }
  });
});
