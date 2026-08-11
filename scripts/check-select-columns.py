#!/usr/bin/env python3
"""
Supabaseクエリのカラム名とDBスキーマの照合チェック

Supabase SDKはカラム名を文字列で受け取るため、存在しないカラムを指定しても
ビルド・型チェックでは検出できない。さらにPostgRESTは不正なカラムを含むクエリで
data を null にして返すだけのケースがあり、実行時にも気づけない。
（2026-08-11: treatment_menus に .order("sort_order") → Web予約の変更画面で
  メニューが1件も表示されない不具合が本番で発生）

このスクリプトは .from("テーブル名") を起点にメソッドチェーンを解析し、
以下を照合する:
  - .select("col, col, ...")            のカラム名
  - .order() / .eq() / .in() / .not() 等 の第1引数（カラム名）
  - .match({ col: value })              のキー

使い方: python3 scripts/check-select-columns.py
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

# 第1引数がカラム名である PostgREST メソッド
# （.not(col, op, val) / .filter(col, op, val) / .textSearch(col, query) も第1引数はカラム）
COLUMN_FIRST_ARG_METHODS = {
    "eq", "neq", "gt", "gte", "lt", "lte",
    "like", "ilike", "likeAllOf", "likeAnyOf", "ilikeAllOf", "ilikeAnyOf",
    "is", "in", "contains", "containedBy",
    "rangeGt", "rangeGte", "rangeLt", "rangeLte", "rangeAdjacent", "overlaps",
    "order", "not", "filter", "textSearch",
}

# .from("テーブル名")
FROM_RE = re.compile(r'\.from\(\s*["\'](\w+)["\']\s*\)')

# チェーンの次のメソッド呼び出し（.single<{...}>() のようなジェネリクスにも対応）
METHOD_RE = re.compile(
    r"\s*(?:/\*.*?\*/\s*|//[^\n]*\n\s*)*"  # 途中のコメント
    r"\.\s*(\w+)\s*"                        # .methodName
    r"(?:<[^()]*?>\s*)?"                    # ジェネリクス（.single<{...}>）
    r"\(",
    re.DOTALL,
)

# 第1引数の文字列リテラル（変数・テンプレートリテラルは対象外）
FIRST_STRING_ARG_RE = re.compile(r'^\s*["\']([^"\']*)["\']')

# .order("col", { referencedTable: "menus" }) の参照先テーブル
REFERENCED_TABLE_RE = re.compile(r'(?:referencedTable|foreignTable)\s*:\s*["\'](\w+)["\']')

# オブジェクトリテラルのキー（.match({ salon_id: x }) 用）
OBJECT_KEY_RE = re.compile(r'["\']?(\w+)["\']?\s*:')


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


def _skip_string(content, i):
    """content[i] が引用符のとき、文字列終端の次の位置を返す"""
    quote = content[i]
    i += 1
    n = len(content)
    while i < n:
        c = content[i]
        if c == "\\":
            i += 2
            continue
        if c == quote:
            return i + 1
        i += 1
    return i


def _skip_comment(content, i):
    """content[i:] がコメント開始のとき、コメント終端の次の位置を返す"""
    if content.startswith("//", i):
        j = content.find("\n", i)
        return len(content) if j == -1 else j + 1
    if content.startswith("/*", i):
        j = content.find("*/", i)
        return len(content) if j == -1 else j + 2
    return i + 1


def find_matching_paren(content, i):
    """content[i] == '(' に対応する ')' の位置を返す（見つからなければ -1）

    文字列リテラル・コメント内の括弧は無視する。
    """
    depth = 0
    n = len(content)
    while i < n:
        c = content[i]
        if c in "\"'`":
            i = _skip_string(content, i)
            continue
        if c == "/" and i + 1 < n and content[i + 1] in "/*":
            i = _skip_comment(content, i)
            continue
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def iter_query_chains(content):
    """.from("テーブル名") を起点にメソッドチェーンを抽出する

    yield: (テーブル名, [{"method", "args", "pos"}, ...])
    """
    for m in FROM_RE.finditer(content):
        table_name = m.group(1)
        pos = m.end()
        calls = []
        while True:
            mm = METHOD_RE.match(content, pos)
            if not mm:
                break
            open_idx = mm.end() - 1
            close_idx = find_matching_paren(content, open_idx)
            if close_idx == -1:
                break
            calls.append(
                {
                    "method": mm.group(1),
                    "args": content[open_idx + 1 : close_idx],
                    "pos": mm.start(1),
                }
            )
            pos = close_idx + 1
        yield table_name, calls, m.start()


def normalize_column(raw):
    """カラム指定文字列から純粋なカラム名部分を取り出す

    - JSON演算子 (settings->>key) / キャスト (col::text) を除去
    - 埋め込みテーブル参照 (treatment_records.salon_id) は (テーブル名, カラム名) を返す
    戻り値: (参照先テーブル or None, カラム名) — 判定不能なら (None, None)
    """
    col = raw.strip()
    if not col:
        return None, None

    # JSON演算子・キャストを除去
    col = re.split(r"->>|->|::", col)[0].strip()

    # 埋め込みテーブル参照を分離（先にドットを処理してから !inner 等を除去する）
    ref_table = None
    if "." in col:
        prefix, _, rest = col.rpartition(".")
        ref_table = prefix.split(".")[-1].split("!")[0].strip()
        col = rest.strip()
    # PostgREST の埋め込み指定（!inner 等）を除去
    col = col.split("!")[0].strip()

    if not re.match(r"^[a-z][a-z0-9_]*$", col):
        return None, None
    return ref_table, col


def line_of(content, pos):
    """文字位置から行番号（1始まり）を求める"""
    return content.count("\n", 0, pos) + 1


def check_column(col_raw, table_name, tables, ctx, errors, method):
    """カラム1件をスキーマと照合し、不一致なら errors に追加"""
    ref_table, col = normalize_column(col_raw)
    if col is None:
        return

    target_table = table_name
    if ref_table:
        # 埋め込みテーブル参照（例: treatment_records.salon_id）
        if ref_table not in tables:
            return  # 別名・未知テーブルは判定不能
        target_table = ref_table

    known = tables.get(target_table)
    if not known or col in known:
        return

    errors.append(
        {
            "file": ctx["file"],
            "line": ctx["line"],
            "table": target_table,
            "column": col,
            "method": method,
            "available": sorted(known),
        }
    )


def scan_source_files(tables):
    """ソースコードのSupabaseクエリをDBスキーマと照合"""
    errors = []
    warnings = []
    unknown_tables = defaultdict(int)

    # .tsx と .ts を統合スキャン
    ts_files = list(SRC_DIR.rglob("*.tsx")) + [
        f for f in SRC_DIR.rglob("*.ts") if f.suffix != ".tsx"
    ]

    for ts_file in sorted(ts_files):
        content = ts_file.read_text()
        lines = content.split("\n")
        relative_path = str(ts_file.relative_to(PROJECT_ROOT))

        for table_name, calls, from_pos in iter_query_chains(content):
            known_columns = tables.get(table_name)
            if not known_columns:
                # スキーマに存在しないテーブル名（Storageバケット名・ビュー等）
                unknown_tables[table_name] += 1
                continue

            from_line = line_of(content, from_pos)
            has_select = False

            for call in calls:
                method = call["method"]
                args = call["args"]
                ctx = {
                    "file": relative_path,
                    "line": line_of(content, call["pos"]),
                }

                # --- .select("col, col, ...") ---
                if method == "select":
                    has_select = True
                    arg_match = FIRST_STRING_ARG_RE.match(args)
                    if not arg_match:
                        continue
                    select_str = arg_match.group(1)
                    # 関連テーブル部分を除去 例: treatment_record_menus(id, name, ...)
                    clean = re.sub(r"\w+\([^)]*\)", "", select_str)
                    if clean.strip() == "*":
                        continue
                    for col in clean.split(","):
                        col = col.strip()
                        # 純粋なカラム名のみ（英小文字とアンダースコア）
                        if not re.match(r"^[a-z_]+$", col):
                            continue
                        check_column(col, table_name, tables, ctx, errors, "select")
                    continue

                # --- .order() / .eq() / .in() / .not() 等（第1引数がカラム名） ---
                if method in COLUMN_FIRST_ARG_METHODS:
                    arg_match = FIRST_STRING_ARG_RE.match(args)
                    if not arg_match:
                        continue  # 変数指定は判定不能
                    col_raw = arg_match.group(1)

                    # .order("col", { referencedTable: "x" }) は参照先テーブルのカラム
                    ref_match = REFERENCED_TABLE_RE.search(args)
                    target = ref_match.group(1) if ref_match else table_name
                    if target not in tables:
                        continue
                    check_column(col_raw, target, tables, ctx, errors, method)
                    continue

                # --- .match({ col: value }) ---
                if method == "match" and args.lstrip().startswith("{"):
                    for key in OBJECT_KEY_RE.findall(args):
                        check_column(key, table_name, tables, ctx, errors, "match")
                    continue

            # salon_id フィルタチェック（.select() を含むクエリのみ）
            if has_select and table_name != "salons" and "salon_id" in known_columns:
                check_context = "\n".join(lines[from_line - 1 : from_line + 19])
                if "salon_id" not in check_context:
                    warnings.append(
                        {
                            "file": relative_path,
                            "line": from_line,
                            "table": table_name,
                        }
                    )

    return errors, warnings, unknown_tables


def main():
    print("=== Supabaseクエリ カラム照合チェック ===\n")

    # スキーマ抽出
    tables = extract_table_columns()
    print(f"テーブル数: {len(tables)}")
    for t, cols in sorted(tables.items()):
        print(f"  {t}: {len(cols)}カラム — {', '.join(sorted(cols))}")
    print()

    # 照合実行
    errors, warnings, unknown_tables = scan_source_files(tables)

    # 結果出力
    for err in errors:
        print(f"{RED}[ERROR]{NC} {err['file']}:{err['line']}")
        print(f"  テーブル: {YELLOW}{err['table']}{NC} / メソッド: {YELLOW}.{err['method']}(){NC}")
        print(f"  存在しないカラム: {RED}{err['column']}{NC}")
        print(f"  利用可能: {', '.join(err['available'])}")
        print()

    for warn in warnings:
        print(f"{YELLOW}[WARN]{NC} {warn['file']}:{warn['line']}")
        print(f"  テーブル {YELLOW}{warn['table']}{NC} に salon_id フィルタがない可能性")
        print()

    if unknown_tables:
        names = ", ".join(f"{t}({c})" for t, c in sorted(unknown_tables.items()))
        print(f"{YELLOW}[INFO]{NC} スキーマ未検出のため未照合の .from(): {names}\n")

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
