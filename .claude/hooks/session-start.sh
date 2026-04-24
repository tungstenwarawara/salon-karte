#!/bin/bash
# SessionStart hook: セッション開始時の自動コンテキスト注入
# settings.json の hooks.SessionStart から呼ばれる

echo "=== salon-karte セッション情報 ==="
echo ""

# 最新コミット
echo "【最新コミット5件】"
git log --oneline -5 2>/dev/null
echo ""

# docs/ の最終更新日
echo "【docs/ 最終更新】"
for f in docs/*.md; do
  if [ -f "$f" ]; then
    LAST_COMMIT=$(git log -1 --format='%ai' -- "$f" 2>/dev/null | cut -d' ' -f1)
    echo "  $f: $LAST_COMMIT"
  fi
done
echo ""

# 未削除の計画ファイル
if [ -d ".claude/plans" ]; then
  PLANS=$(find .claude/plans -type f -name "*.md" 2>/dev/null)
  if [ -n "$PLANS" ]; then
    echo "⚠️ .claude/plans/ に未削除ファイルあり:"
    echo "$PLANS" | sed 's/^/  /'
    echo ""
  fi
fi

# ページ数
PAGE_COUNT=$(find src/app -name 'page.tsx' 2>/dev/null | wc -l)
MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "【規模】ページ: ${PAGE_COUNT}, マイグレーション: ${MIGRATION_COUNT}"
echo ""

# Phase 1 集中検証ウィンドウのステータス（2026-04-24 開始、2週間）
VALIDATION_START="2026-04-24"
VALIDATION_END="2026-05-08"
NOW_TS=$(date +%s 2>/dev/null)
START_TS=$(date -d "$VALIDATION_START" +%s 2>/dev/null)
END_TS=$(date -d "$VALIDATION_END" +%s 2>/dev/null)
if [ -n "$NOW_TS" ] && [ -n "$START_TS" ] && [ -n "$END_TS" ]; then
  if [ "$NOW_TS" -ge "$START_TS" ] && [ "$NOW_TS" -le "$END_TS" ]; then
    DAYS_ELAPSED=$(( (NOW_TS - START_TS) / 86400 + 1 ))
    DAYS_LEFT=$(( (END_TS - NOW_TS) / 86400 ))
    # 検証期間中のコミット数を実測
    VALIDATION_COMMITS=$(git log --since="$VALIDATION_START" --oneline 2>/dev/null | wc -l)
    echo "🎯 Phase 1 集中検証ウィンドウ: Day ${DAYS_ELAPSED}/14（残り ${DAYS_LEFT}日）"
    echo "   期間中コミット数: ${VALIDATION_COMMITS}"
    echo "   方針: 新機能開発停止、テスター経由紹介で有料成約を検証"
    echo "   詳細: docs/commercial-launch-roadmap.md の Phase 1 集中検証ウィンドウ参照"
    echo ""
  fi
fi

# docs の乖離チェック（簡易）
PLAN_DOC="docs/competitive-analysis-and-plan.md"
if [ -f "$PLAN_DOC" ]; then
  DOC_DATE=$(grep -oP '更新日: \K[0-9-]+' "$PLAN_DOC" 2>/dev/null | head -1)
  LATEST_COMMIT_DATE=$(git log -1 --format='%ai' 2>/dev/null | cut -d' ' -f1)
  if [ -n "$DOC_DATE" ] && [ -n "$LATEST_COMMIT_DATE" ]; then
    DOC_TS=$(date -d "$DOC_DATE" +%s 2>/dev/null)
    COMMIT_TS=$(date -d "$LATEST_COMMIT_DATE" +%s 2>/dev/null)
    if [ -n "$DOC_TS" ] && [ -n "$COMMIT_TS" ]; then
      DIFF_DAYS=$(( (COMMIT_TS - DOC_TS) / 86400 ))
      if [ "$DIFF_DAYS" -gt 7 ]; then
        echo "⚠️ $PLAN_DOC の更新日($DOC_DATE)が ${DIFF_DAYS}日前です。"
        echo "   最新コミットとの乖離がないか確認してください。"
        echo ""
      fi
    fi
  fi
fi

echo "=== セッション開始 ==="
