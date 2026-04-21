#!/bin/bash
# StatusLine: salon-karte のプロジェクト状態を常時表示
# settings.json の statusLine から呼ばれる

# stdin の JSON は使わず、cwd から git 情報を取得
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(pwd)"

# ブランチ名
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
BRANCH=${BRANCH:-"detached"}

# 未コミット変更数
DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
DIRTY=""
if [ "$DIRTY_COUNT" -gt 0 ]; then
  DIRTY=" ●${DIRTY_COUNT}"
fi

# origin との差（ahead/behind）
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
SYNC=""
if [ -n "$UPSTREAM" ]; then
  AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null)
  BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null)
  [ "$AHEAD" -gt 0 ] 2>/dev/null && SYNC+=" ↑${AHEAD}"
  [ "$BEHIND" -gt 0 ] 2>/dev/null && SYNC+=" ↓${BEHIND}"
fi

# ページ300行・コンポーネント200行 超過数
PAGE_VIOL=$(wc -l src/app/\(dashboard\)/*/page.tsx src/app/\(dashboard\)/*/*/page.tsx src/app/\(dashboard\)/*/*/*/page.tsx src/app/\(dashboard\)/*/*/*/*/page.tsx 2>/dev/null | awk '$1 > 300 && !/total/' | wc -l | tr -d ' ')
COMP_VIOL=$(wc -l src/components/**/*.tsx 2>/dev/null | awk '$1 > 200 && !/total/' | wc -l | tr -d ' ')

VIOLATIONS=""
if [ "$PAGE_VIOL" -gt 0 ] || [ "$COMP_VIOL" -gt 0 ]; then
  VIOLATIONS=" ⚠ size:${PAGE_VIOL}p/${COMP_VIOL}c"
fi

# ページ数・マイグレーション数（軽量版）
PAGE_COUNT=$(find src/app -name 'page.tsx' 2>/dev/null | wc -l | tr -d ' ')
MIG_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

printf "📿 salon-karte | %s%s%s | 📄%s 🗂%s%s" "$BRANCH" "$DIRTY" "$SYNC" "$PAGE_COUNT" "$MIG_COUNT" "$VIOLATIONS"
