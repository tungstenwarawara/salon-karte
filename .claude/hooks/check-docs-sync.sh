#!/bin/bash
# PreToolUse hook: git commit 時に docs/ の更新忘れを検知
# 機能追加コミットなのに docs/ が更新されていない場合に警告

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# git commit コマンドのみ対象
if [[ ! "$COMMAND" =~ ^git[[:space:]]+commit ]]; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
fi

cd "$PROJECT_DIR" 2>/dev/null || exit 0

# ステージされたファイルを取得
STAGED=$(git diff --cached --name-only 2>/dev/null)

# 機能追加の指標: マイグレーション、新ページ、API追加
HAS_MIGRATION=$(echo "$STAGED" | grep -c "^supabase/migrations/")
HAS_NEW_PAGE=$(echo "$STAGED" | grep -c "page\.tsx$")
HAS_NEW_API=$(echo "$STAGED" | grep -c "^src/app/api/")
HAS_PLAN_UPDATE=$(echo "$STAGED" | grep -c "^src/lib/plan\.ts")

# docs/ の変更があるか
HAS_DOCS_UPDATE=$(echo "$STAGED" | grep -c "^docs/")

# 重要な変更があるのに docs/ が更新されていない場合
if [[ "$HAS_MIGRATION" -gt 0 || "$HAS_PLAN_UPDATE" -gt 0 ]] && [[ "$HAS_DOCS_UPDATE" -eq 0 ]]; then
  REASON="💡 マイグレーションまたはプラン定義が変更されていますが、docs/ が更新されていません。"
  REASON="$REASON docs/competitive-analysis-and-plan.md や docs/pricing-plan-spec.md の更新が必要か確認してください。"

  jq -n --arg reason "$REASON" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "permissionDecisionReason": $reason
    }
  }'
  exit 0
fi

exit 0
