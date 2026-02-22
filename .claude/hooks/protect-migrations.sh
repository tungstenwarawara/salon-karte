#!/bin/bash
# 適用済みマイグレーションファイルの編集をブロックする
# 新規作成は許可、既存の変更はブロック

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# マイグレーションファイル以外はスルー
if [[ ! "$FILE_PATH" =~ supabase/migrations/ ]]; then
  exit 0
fi

# ファイルが既に存在する場合（＝適用済みの可能性）はブロック
if [[ -f "$FILE_PATH" ]]; then
  jq -n --arg reason "適用済みマイグレーションの編集はデータ不整合を引き起こします。新しいマイグレーションファイルを作成してください。" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": $reason
    }
  }'
  exit 0
fi

# 新規ファイルは許可
exit 0
