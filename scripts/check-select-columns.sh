#!/usr/bin/env python3
"""
selectカラム名とDBスキーマの照合チェック

Supabase SDKの.select()は文字列型のため、存在しないカラムを指定しても
ビルド・実行時エラーにならない。このスクリプトでコミット前に検出する。

使い方: python3 scripts/check-select-columns.sh
  または: bash scripts/check-select-columns.sh（shebangでpython3を呼ぶ）
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

# プロジェクトルート
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = PROJECT_ROOT / "supabase" / "migrations"
SRC_DIR = PROJECT_ROOT / "src"

# カラー出力
RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
NC = "\033[0m"

# SQLの予約語（カラム名ではないのでスキップ）
SQL_RESERVED = {
    "constraint", "primary", "check", "unique", "foreign", "create",
    "references", "index", "on", "delete", "update", "set", "cascade",
    "default", "not", "null", "if", "exists", "true", "false", "key",
    "table", "alter", "add", "column", "drop", "grant", "revoke",
    "insert", "into", "values", "select", "from", "where", "and", "or",
}


def extract_table_columns():
    """マイグレーションファイルから各テーブルのカラム一覧を抽出"""
    tables = defaultdict(set)

    if not MIGRATIONS_DIR.exists():
        print(f"{RED}エラー: {MIGRATIONS_DIR} が見つかりません{NC}")
        sys.exit(1)

    for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
        content = sql_file.read_text()

        # CREATE TABLE table_name ( ... ) からカラム抽出
        # 最小マッチで ); を探す
        create_matches = re.finditer(
            r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*?)\);",
            content,
            re.DOTALL | re.IGNORECASE,
        )
        for m in create_matches:
            table_name = m.group(1)
            body = m.group(2)
            for line in body.split("\n"):
                line = line.strip().rstrip(",")
                if not line:
                    continue
                # CONSTRAINT, PRIMARY KEY, CHECK等のテーブル制約はスキップ
                if re.match(
                    r"(CONSTRAINT|PRIMARY\s+KEY|CHECK|UNIQUE|FOREIGN\s+KEY|--)",
                    line,
                    re.IGNORECASE,
                ):
                    continue
                # カラム定義: カラム名 型名 [制約...]
                # 型名は大文字英字で始まる識別子（UUID, TEXT, INTEGER等）
                col_match = re.match(
                    r"(\w+)\s+"
                    r"(UUID|TEXT|VARCHAR|CHAR|INTEGER|INT|BIGINT|SMALLINT|SERIAL|BIGSERIAL"
                    r"|DATE|TIME|TIMESTAMPTZ|TIMESTAMP|INTERVAL"
                    r"|BOOLEAN|BOOL"
                    r"|JSONB|JSON"
                    r"|NUMERIC|DECIMAL|REAL|FLOAT|DOUBLE\s+PRECISION"
                    r"|BYTEA)",
                    line,
                    re.IGNORECASE,
                )
                if col_match:
                    col_name = col_match.group(1).lower()
                    if col_name not in SQL_RESERVED:
                        tables[table_name].add(col_name)

        # ALTER TABLE table ADD COLUMN [IF NOT EXISTS] col_name TYPE
        # 複数カラムを1つのALTER TABLE文で追加するケースに対応:
        #   ALTER TABLE customers
        #     ADD COLUMN IF NOT EXISTS address TEXT,
        #     ADD COLUMN IF NOT EXISTS marital_status TEXT;
        # まずALTER TABLE文全体（セミコロンまで）を抽出し、
        # その中からADD COLUMNを全て取得する
        alter_blocks = re.finditer(
            r"ALTER\s+TABLE\s+(\w+)\s+(.*?);",
            content,
            re.DOTALL | re.IGNORECASE,
        )
        for block in alter_blocks:
            alter_table_name = block.group(1)
            alter_body = block.group(2)
            add_col_matches = re.finditer(
                r"ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)",
                alter_body,
                re.IGNORECASE,
            )
            for acm in add_col_matches:
                col_name = acm.group(1).lower()
                if col_name not in SQL_RESERVED:
                    tables[alter_table_name].add(col_name)

    return tables


def scan_source_files(tables):
    """ソースコードの.select()カラムをDBスキーマと照合"""
    errors = []
    warnings = []

    # .tsx と .ts を統合スキャン
    ts_files = list(SRC_DIR.rglob("*.tsx")) + [
        f for f in SRC_DIR.rglob("*.ts") if f.suffix != ".tsx"
    ]

    for ts_file in ts_files:
        content = ts_file.read_text()
        lines = content.split("\n")
        relative_path = ts_file.relative_to(PROJECT_ROOT)

        from_pattern = re.compile(r'\.from\(\s*["\'](\w+)["\']\s*\)')

        for i, line in enumerate(lines):
            from_match = from_pattern.search(line)
            if not from_match:
                continue

            table_name = from_match.group(1)
            known_columns = tables.get(table_name)
            if not known_columns:
                continue

            # 次の10行からselectを探す
            context = "\n".join(lines[i : i + 10])
            select_match = re.search(
                r'\.select\(\s*["\']([^"\']+)["\']\s*\)', context
            )
            if not select_match:
                continue

            select_str = select_match.group(1)

            # 関連テーブル部分を除去 例: treatment_record_menus(id, name, ...)
            clean = re.sub(r"\w+\([^)]*\)", "", select_str)

            # ワイルドカードの場合はスキップ
            if clean.strip() == "*":
                continue

            # カラム名を分割
            columns = [c.strip() for c in clean.split(",") if c.strip()]

            for col in columns:
                # 純粋なカラム名のみ（英小文字とアンダースコア）
                if not re.match(r"^[a-z_]+$", col):
                    continue
                if col not in known_columns:
                    errors.append(
                        {
                            "file": str(relative_path),
                            "line": i + 1,
                            "table": table_name,
                            "column": col,
                            "available": sorted(known_columns),
                        }
                    )

            # salon_id フィルタチェック
            if table_name != "salons" and "salon_id" in known_columns:
                check_context = "\n".join(lines[i : i + 20])
                if "salon_id" not in check_context:
                    warnings.append(
                        {
                            "file": str(relative_path),
                            "line": i + 1,
                            "table": table_name,
                        }
                    )

    return errors, warnings


def main():
    print("=== selectカラム照合チェック ===\n")

    # スキーマ抽出
    tables = extract_table_columns()
    print(f"テーブル数: {len(tables)}")
    for t, cols in sorted(tables.items()):
        print(f"  {t}: {len(cols)}カラム — {', '.join(sorted(cols))}")
    print()

    # 照合実行
    errors, warnings = scan_source_files(tables)

    # 結果出力
    for err in errors:
        print(f"{RED}[ERROR]{NC} {err['file']}:{err['line']}")
        print(f"  テーブル: {YELLOW}{err['table']}{NC}")
        print(f"  存在しないカラム: {RED}{err['column']}{NC}")
        print(f"  利用可能: {', '.join(err['available'])}")
        print()

    for warn in warnings:
        print(f"{YELLOW}[WARN]{NC} {warn['file']}:{warn['line']}")
        print(f"  テーブル {YELLOW}{warn['table']}{NC} に salon_id フィルタがない可能性")
        print()

    print("=== チェック完了 ===")
    if errors:
        print(f"{RED}エラー: {len(errors)}件{NC} — 存在しないカラムが指定されています")
        sys.exit(1)
    elif warnings:
        print(f"{YELLOW}警告: {len(warnings)}件{NC} — salon_idフィルタ欠落の可能性")
        sys.exit(0)
    else:
        print(f"{GREEN}問題なし{NC}")
        sys.exit(0)


if __name__ == "__main__":
    main()
