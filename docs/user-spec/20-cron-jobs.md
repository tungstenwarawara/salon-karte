# 定期実行ジョブ（Cron Jobs）

> 更新日: 2026-04-28
> 対象コード: `src/app/api/cron/`, `vercel.json`

このファイルは Vercel Cron Jobs が定期的に実行する処理の仕様。テスター指摘「LINE リマインドが届かない」の根本切り分けに直結する。

## 目次

- [Cron 一覧](#cron-一覧)
- [認証・セキュリティ](#認証セキュリティ)
- [Cron 1: 前日リマインド（line-reminders）](#cron-1-前日リマインドline-reminders)
- [動作確認手順](#動作確認手順)
- [既知の問題・今後の予定](#既知の問題今後の予定)

---

## Cron 一覧

| # | パス | スケジュール | UTC | JST | 用途 |
|---|------|------------|-----|-----|------|
| 1 | `/api/cron/line-reminders` | `0 12 * * *` | 毎日 12:00 | 毎日 21:00 | 翌日の予約者に LINE/メールで前日リマインドを送信 |

> **現状は1ジョブのみ**。Phase 2 で追加予定のジョブは「今後の予定」セクション参照。

### Vercel プラン制限

- **Hobby プラン**: 1日2回まで → 現状 1日1回なので無料枠内
- **Pro プラン**: 制限緩和

> 商用化（Phase 2）で Vercel Pro に移行すると複数ジョブ追加が可能になる。

---

## 認証・セキュリティ

すべての cron エンドポイントは以下の認証を要求する。

### 認証ヘッダー

```
Authorization: Bearer {CRON_SECRET}
```

- `CRON_SECRET` は環境変数（Vercel Production に設定済み）
- Vercel Cron が**自動的にこのヘッダー付きで叩く**ため、特別な設定は不要
- 認証失敗時は 401 で即時 return

### CRON_SECRET 未設定時の挙動

- `console.error` + Sentry に警告メッセージ送信
- 500 エラーを返す
- リマインドは送信されない

### 認証失敗時の挙動

- 401 エラーを返す
- リマインドは送信されない
- ログ記録のみ

> **テストサロンでの手動実行**: 開発者が手元で実行する場合は、curl で `Authorization: Bearer {CRON_SECRET}` ヘッダーを付ければ可能。ただしテストサロンの予約状況によっては送信ゼロになる。

---

## Cron 1: 前日リマインド（line-reminders）

### 仕様

| 項目 | 内容 |
|------|-----|
| パス | `/api/cron/line-reminders` |
| HTTP メソッド | **GET**（POST にすると 405 で空振り。2026-04-22 に修正済み）|
| スケジュール | `0 12 * * *`（毎日 12:00 UTC = 21:00 JST）|
| Vercel リージョン | `hnd1`（東京リージョン）|
| 認証 | `Authorization: Bearer {CRON_SECRET}` |

### 実行フロー

1. CRON_SECRET 検証（失敗で 401 / 500）
2. 翌日（JST）の日付を計算（サーバーは UTC 動作なので +9h して翌日を求める）
3. 全サロン横断で `appointments` を取得（条件: `appointment_date = 翌日 AND status = 'scheduled'`）
4. 該当予約がなければ `{ line: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 }, date: '...' }` を返して終了
5. サロン情報・LINE設定・LINE紐付けを一括取得（クエリ最適化）
6. 各予約について次を実行:
   - **LINE 送信**: `is_active && reminder_enabled && is_following` なら送信。`line_message_logs` に記録
   - **メール送信**: `customers.email` があれば送信
7. 集計結果を JSON で返す

### レスポンス形式

```json
{
  "line":  { "sent": 3, "failed": 0 },
  "email": { "sent": 5, "failed": 1 },
  "date":  "2026-04-29"
}
```

### LINE 送信の条件マトリクス

| `is_active` | `reminder_enabled` | `is_following` | LINE送信 |
|------------|------|------|--------|
| true | true | true | ✅ 送信 |
| true | true | false | スキップ（ブロック中） |
| true | false | * | スキップ（リマインド OFF） |
| false | * | * | スキップ（連携無効） |
| ※ 紐付けなし | * | * | スキップ |

### メール送信の条件

| `customers.email` | `RESEND_API_KEY` | メール送信 |
|------|------|------|
| あり | 設定済み | ✅ 送信 |
| あり | 未設定 | スキップ（コンソール警告） |
| なし | * | スキップ |

### 失敗時の挙動

- 個別の送信エラーは `console.error` + Sentry + `line_message_logs` (LINE のみ) に記録
- **リトライしない**（次回 cron は24時間後）
- 集計は継続（1件失敗しても他の送信は続行）

---

## 動作確認手順

### 1. Vercel Dashboard で実行履歴を確認

1. Vercel Dashboard → 該当プロジェクト
2. Settings → Crons → 該当 cron の **Logs** タブ
3. 直近24時間の実行履歴を確認
   - **緑（200）**: 正常実行
   - **赤（401）**: CRON_SECRET 不一致
   - **赤（500）**: サーバーエラー → Sentry を見る

### 2. Sentry で エラー確認

- フィルタ: `feature:line-reminder` or `feature:email-reminder`
- 直近のエラーがあれば原因を特定

### 3. line_message_logs でログ確認

```sql
-- 直近の cron 実行で送信されたリマインド
SELECT salon_id, customer_line_link_id, status, error_message, sent_at, created_at
FROM line_message_logs
WHERE message_type = 'reminder'
  AND created_at >= NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;
```

### 4. 手動実行（テスト用）

本番 URL に対して curl:

```bash
curl -X GET https://www.salonkarte.com/api/cron/line-reminders \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

レスポンスで `line.sent` / `email.sent` の数値を確認。

---

## 既知の問題・今後の予定

### 既知の問題

| 問題 | 影響度 | 対応状況 |
|------|------|--------|
| 失敗時のリトライ機構なし | 中 | 失敗するとその日のリマインドは永久に届かない |
| 当日 21:00 を過ぎてから登録された翌日予約は対象外 | 低 | cron 実行時に DB を見るので、それ以降の登録は次回（翌日）まで通知されない |
| マルチサロンで1サロンの問題が他に波及するリスク | 低 | 現状は try/catch で個別処理しているので影響なし |
| Vercel Hobby プランのまま運用 | 中 | Pro 移行時にジョブ追加可能に |

### 今後の予定（実装予定 / 未実装）

| 項目 | 状態 | 優先度 |
|------|-----|-------|
| 当日朝のリマインド（午前9時など）| 未実装 | 中 |
| 直前リマインド（予約2時間前など）| 未実装 | 低 |
| 失敗リトライ機構（2時間後に再送）| 未実装 | 中 |
| サブスクリプション期限切れ通知 | 未実装 | 中（Phase 2 商用化後）|
| 在庫の発注点アラート定期通知 | 未実装 | 低 |
| 月次レポート自動送信（前月の売上サマリー）| 未実装 | 低 |
| 離脱顧客（90日未来店）の自動アラート | 未実装 | 低 |

### Phase 2 で必須対応

- **失敗時のリトライ**: 商用化後はリマインド未着が解約理由になり得る
- **複数 cron への対応準備**: Vercel Pro 移行と同時に追加可能に
- **cron 実行ログの DB 保存**: 現状は Vercel Dashboard 依存

---

## 関連ファイル

- `18-emails.md` — リマインドのメール送信仕様
- `19-line-messages.md` — リマインドの LINE 送信仕様（line_message_logs 含む）
- `12-line-settings.md` — `reminder_enabled` のサロン側設定 UI
- `06-appointments.md` — リマインド対象となる予約の状態管理
- `.claude/rules/external-services.md` — Vercel プラン制限・障害対応
