#!/bin/bash
# git commit 実行前にカラム名照合チェックを自動実行するhook
# settings.json の hooks.PreToolUse から呼ばれる

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# git commit コマンド以外はスルー
if [[ ! "$COMMAND" =~ ^git[[:space:]]+commit ]]; then
  exit 0
fi

# カラム名照合チェックを実行
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
fi

CHECK_RESULT=$(cd "$PROJECT_DIR" && python3 scripts/check-select-columns.sh 2>&1)
CHECK_EXIT=$?

if [[ $CHECK_EXIT -ne 0 ]]; then
  # エラーあり: コミットをブロック
  jq -n --arg reason "カラム名照合チェックでエラーが検出されました。先に修正してください:\n$CHECK_RESULT" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": $reason
    }
  }'
  exit 0
fi

# チェックパス: コミットを許可
exit 0
