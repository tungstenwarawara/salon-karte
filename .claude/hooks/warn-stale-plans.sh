#!/bin/bash
# セッション開始時に .claude/plans/ に残存ファイルがあれば警告するhook
# settings.json の hooks.PreToolUse (Bash) から呼ばれる
# 初回のコマンド実行時に1度だけチェックする

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# git log コマンド（セッション開始時の実態確認）をトリガーにする
if [[ ! "$COMMAND" =~ ^git[[:space:]]+log ]]; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
fi

PLANS_DIR="$PROJECT_DIR/.claude/plans"

# plans ディレクトリが存在し、中にファイルがある場合に警告
if [[ -d "$PLANS_DIR" ]]; then
  PLAN_FILES=$(find "$PLANS_DIR" -type f -name "*.md" 2>/dev/null)
  if [[ -n "$PLAN_FILES" ]]; then
    FILE_LIST=$(echo "$PLAN_FILES" | sed "s|$PROJECT_DIR/||g" | tr '\n' ', ')
    jq -n --arg reason "⚠️ .claude/plans/ に未削除の計画ファイルがあります: ${FILE_LIST}\nこれらは前回セッションの残骸の可能性があります。ソースコードの実態と照合してから判断してください。" '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason": $reason
      }
    }'
    exit 0
  fi
fi

exit 0
