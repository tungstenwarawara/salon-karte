# LINE 送信トリガー一覧（横断仕様）

> 更新日: 2026-04-28
> 対象コード: `src/lib/line/`, `src/app/api/line/`, `src/app/api/cron/line-reminders/`, `src/lib/booking/notifications.ts`

このファイルは LINE 公式アカウントから顧客への送信、および顧客からの受信処理を網羅した横断仕様。テスター指摘「LINE リマインドが届かない」の切り分け基準を含む。

## 目次

- [送信トリガー全体一覧](#送信トリガー全体一覧)
- [受信イベント処理](#受信イベント処理)
- [共通仕様（接続・暗号化・スキップ条件）](#共通仕様接続暗号化スキップ条件)
- [トリガー詳細](#トリガー詳細)
  - [1. 接続テストメッセージ](#1-接続テストメッセージ)
  - [2. Web予約 確認通知](#2-web予約-確認通知)
  - [3. 予約確認の手動再送](#3-予約確認の手動再送)
  - [4. 前日リマインド](#4-前日リマインド)
- [配信ログ（line_message_logs テーブル）](#配信ログline_message_logs-テーブル)
- [テスター指摘の切り分け手順](#テスター指摘の切り分け手順)
- [既知の問題・今後の予定](#既知の問題今後の予定)

---

## 送信トリガー全体一覧

| # | トリガー | 受信者 | メッセージ種別 | 送信元コード |
|---|--------|------|------------|------------|
| 1 | サロンが LINE 設定画面で「接続テスト」を押す | サロン本人（テスト送信） | テキスト「接続テスト成功」 | `src/app/api/line/test/route.ts` |
| 2 | 顧客がWeb予約を完了（友だち登録済みの場合） | 予約した顧客 | 予約確認メッセージ | `src/lib/booking/notifications.ts` |
| 3 | オーナーが予約詳細から「LINE通知を送信」を押す | 予約の顧客 | 予約確認メッセージ | `src/app/api/line/notify-appointment/route.ts` |
| 4 | 毎日 21:00 JST の Vercel Cron | 翌日に予約がある顧客（友だち登録済み） | リマインドメッセージ | `src/app/api/cron/line-reminders/route.ts` |

> **重要**: メール送信（`18-emails.md` 参照）と並行する経路。同じ予約イベントで両方発火する場合がある。
> 
> **注意**: 「カスタムメッセージ送信」「メッセージ配信機能」「友だち全員へのお知らせ配信」は**未実装**。Push API による1対1の自動送信のみ。

---

## 受信イベント処理

サロンの LINE 公式アカウントから受信する Webhook イベントの処理（`src/app/api/line/webhook/route.ts` + `src/lib/line/event-handler.ts`）。

### 受信するイベント種別

| イベント | 発生タイミング | 処理 |
|---------|------------|-----|
| `follow` | ユーザーがサロンの公式アカウントを友だち追加 | `customer_line_links` に新規行作成（`is_following = true`、`customer_id = null`） |
| `unfollow` | ユーザーがブロック / 友だち削除 | `customer_line_links.is_following = false` に更新 |
| `message` | ユーザーがメッセージ送信 | 現状: ログ記録のみ。返信・自動応答は未実装 |
| その他 | postback / videoPlayComplete 等 | 無視（ログのみ） |

### Webhook 認証

- LINE 側から送られてくる `X-Line-Signature` ヘッダーを検証
- サロン固有の `webhook_secret_encrypted`（暗号化保存）を復号して検証
- 検証失敗時は 401 を返す（メッセージは処理されない）

### 友だち追加直後のフロー

1. ユーザーが LINE で「友だち追加」
2. LINE が salon-karte の Webhook を呼ぶ
3. `customer_line_links` に行が追加される（`customer_id = null`）
4. オーナーが `/customers/{id}` の **LINE連携セクション**で手動紐付け（`04-customers.md` 参照）

> **重要**: 紐付けは手動。自動マッピング（電話番号や名前）は未実装。

### 顧客側からの送信メッセージ

現状は受信ログのみ。「予約変更したい」「キャンセルしたい」といった顧客のメッセージへの自動応答や、リッチメニューでの操作受付は未実装。

---

## 共通仕様（接続・暗号化・スキップ条件）

### LINE 公式アカウント（コミュニケーションプラン）の制限

- **無料枠**: Push メッセージ月 200 通まで
- 1サロンあたり想定送信量: 月 50〜100 通（無料枠内）
- 超過時: LINE API が 429 エラーを返す → 送信失敗扱い
- 有料プランは **サロン側で契約**（salon-karte のインフラ費用ではない）

### 設定情報の保存

- テーブル: `salon_line_configs`
- 保存項目:
  - `channel_id` / `channel_secret_encrypted` / `channel_access_token_encrypted`（AES-256 暗号化）
  - `webhook_secret_encrypted`
  - `is_active`: 連携が有効かどうか
  - `reminder_enabled`: 前日リマインドを ON にしているか
- 復号鍵: `ENCRYPTION_KEY` 環境変数

### 暗号化スキーム

- アルゴリズム: AES-256-GCM
- 鍵: `ENCRYPTION_KEY` 環境変数（32バイト・本番固有）
- IV: ランダム生成、暗号文と一緒に保存

> 注意: `ENCRYPTION_KEY` が変わると既存の暗号化トークンが復号不能になる。本番では絶対に変更しない。

### スキップ条件

LINE 送信が試行されない条件は次のとおり:

| 条件 | スキップされるトリガー |
|------|--------------------|
| `salon_line_configs.is_active = false` | 全LINEトリガー |
| `customer_line_links` に該当顧客の行がない | 該当顧客向け全トリガー |
| `customer_line_links.is_following = false`（ブロック中） | 該当顧客向け全トリガー |
| `salon_line_configs.reminder_enabled = false` | リマインドのみ（他は送信される） |
| `channel_access_token_encrypted` の復号失敗 | 全トリガー（Sentry にエラー記録） |

### 送信失敗時の挙動

- `console.error` でログ
- Sentry に送信（`feature: line-reminder` 等のタグ付き）
- `line_message_logs` テーブルに `status = 'failed'` で記録（リマインド・予約確認）
- アプリの主要動作（予約作成等）は失敗扱いにしない（graceful degradation）

---

## トリガー詳細

### 1. 接続テストメッセージ

**送信タイミング**: サロンが `/settings/line` で **接続テスト** を押したとき

**送信先**: そのサロンの LINE 公式アカウントを **友だち追加済みの全ユーザー**のうち、最初の1人 or 指定した line_user_id

**メッセージ内容**:
- テキスト「サロンカルテとの接続テストです。このメッセージが届けば成功です。」
- 通常はオーナー本人が自分の LINE で受信して動作確認

**用途**:
- LINE 設定（チャネルアクセストークン等）が正しく入力されているか確認
- 暗号化保存・復号が動作するか確認

**スキップ条件**:
- 友だち登録が0人 → 「友だちが登録されていません」エラー

### 2. Web予約 確認通知

**送信タイミング**: 顧客が `/book/{salonSlug}` から予約完了直後

**送信先**: 予約した顧客（`customer_line_links.is_following = true` の場合のみ）

**メッセージ内容**（テキスト）:
```
{顧客名}様

ご予約を承りました。

日時: {M月D日（曜）} {HH:MM}〜
メニュー: {メニュー1}、{メニュー2}
担当: {スタッフ名}（指定があれば）

ご来店をお待ちしております。
{サロン名}
```

**スキップ条件**:
- 顧客が LINE 友だち未登録 → スキップ（メールは送信される、`18-emails.md` 参照）
- LINE連携が無効 → スキップ
- 暗号化トークンの復号失敗 → エラー（Sentry に記録）

**送信ログ**: `line_message_logs` テーブルに `message_type = 'confirmation'` で記録

> **テスター動作**: 予約確認 LINE は **届く** 報告（2026-04-28）。LINE API 接続・暗号化・友だち登録は OK ということ。

### 3. 予約確認の手動再送

**送信タイミング**: オーナーが `/appointments/{id}` の **予約詳細ページ**から「LINE通知を再送信」ボタンを押したとき

**送信先**: その予約の顧客（友だち登録済みの場合のみ）

**メッセージ内容**: トリガー2と同じ（予約確認メッセージ）

**用途**:
- Web予約以外（電話・直接来店）で予約を作成した場合の通知送信
- トリガー2が失敗した場合の手動再送

**スキップ条件**: トリガー2と同じ

**送信ログ**: `line_message_logs` テーブルに記録

### 4. 前日リマインド

**送信タイミング**: 毎日 21:00 JST (`0 12 * * *` UTC) に Vercel Cron が `/api/cron/line-reminders` を呼び出す

**送信先**: 翌日（日本時間）に予約があり、`status = 'scheduled'` で **`is_following = true` の顧客**

**メッセージ内容**（テキスト）:
```
{顧客名}様

明日のご予約のお知らせです。

日時: {M月D日（曜）} {HH:MM}〜
メニュー: {メニュー1}、{メニュー2}
担当: {スタッフ名}（指定があれば）

{サロン名}でお待ちしております。
```

**Cron 認証**:
- `Authorization: Bearer {CRON_SECRET}` ヘッダーが必須
- 検証失敗時は 401（リマインドは1件も送られない）

**Cron 実行のフロー**:
1. CRON_SECRET 検証
2. 翌日（JST）の `status = 'scheduled'` 予約を全件取得（マルチサロン対応）
3. サロン情報・LINE設定・顧客の友だち情報を一括取得
4. 各予約について:
   - LINE: `is_active && reminder_enabled && is_following` なら送信、`line_message_logs` に記録
   - メール: `customers.email` があれば送信
5. 集計結果をレスポンス

**スキップ条件**（このトリガー固有）:
- `salon_line_configs.reminder_enabled = false` → このサロンのリマインドはスキップ（個別予約ごとではなくサロン全体）
- `customer_line_links.is_following = false`（ブロック中） → 該当顧客のみスキップ
- 翌日の予約がない → cron は早期 return（送信ゼロ）

**送信ログ**: `line_message_logs` テーブルに `message_type = 'reminder'` で記録

> **テスター動作**: リマインドが**届かない**報告（2026-04-28）。トリガー2（予約確認）は届くため、LINE API 自体は機能している → このトリガー固有の問題に絞られている。
> 切り分けは「テスター指摘の切り分け手順」参照。

---

## 配信ログ（line_message_logs テーブル）

送信ログは `line_message_logs` テーブルに保存される。

### スキーマ概要

| カラム | 内容 |
|--------|----|
| `id` | UUID |
| `salon_id` | 送信元サロン |
| `customer_line_link_id` | 送信先（顧客紐付け）|
| `message_type` | `'confirmation'` / `'reminder'` / `'test'` 等 |
| `status` | `'sent'` / `'failed'` |
| `error_message` | 失敗時のエラー文（任意） |
| `related_appointment_id` | 関連予約 ID（任意） |
| `sent_at` | 送信時刻 |
| `created_at` | レコード作成時刻 |

### よくあるクエリ

**「テスターのサロンの直近のリマインド送信履歴」**:
```sql
SELECT * FROM line_message_logs
WHERE salon_id = '{テスターのサロンID}'
  AND message_type = 'reminder'
ORDER BY created_at DESC
LIMIT 10;
```

**「直近24時間で失敗したLINE送信」**:
```sql
SELECT * FROM line_message_logs
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

> **これがあれば**「LINE届かない」のときに最初に確認すべきテーブル。送信失敗のエラー文も入っている。

---

## テスター指摘の切り分け手順

### 「LINE リマインドが届かない」（2026-04-28 報告）の切り分け

予約確認は届くがリマインドだけ届かない場合、**cron 経路に絞り込まれている**。次の順で確認する:

#### Step 1: そもそも cron が実行されているか

- **Vercel ダッシュボード** → 該当プロジェクト → Settings → Crons → 該当 cron の **Logs**
- 21:00 JST（12:00 UTC）に実行履歴があるか
- ステータスが 200 か（401 なら CRON_SECRET 不一致、500 ならコードエラー）

#### Step 2: cron 実行履歴があるが届かない場合

- `line_message_logs` で当該サロンのリマインドログを確認
  - `status = 'sent'` のレコードがあるなら **送信成功**（届かない原因は LINE 側 or 受信端末）
  - `status = 'failed'` なら `error_message` を確認
  - **そもそもレコードがない** なら下のいずれか:
    - `salon_line_configs.reminder_enabled = false`
    - `customer_line_links.is_following = false`
    - 翌日の予約が `status = 'scheduled'` ではない（completed / cancelled になっている）

#### Step 3: ログがあって sent なのに届かない場合

- LINE 公式アカウントの**メッセージ通数上限**（月200通）超過の可能性
  - LINE Official Account Manager で確認
- 受信者の LINE 通知設定 / おやすみモード
- 受信者が公式アカウントを**通知オフ**にしている

#### Step 4: 該当サロンの設定確認

```sql
SELECT salon_id, is_active, reminder_enabled
FROM salon_line_configs
WHERE salon_id = '{テスターのサロンID}';

SELECT customer_id, is_following, line_user_id
FROM customer_line_links
WHERE salon_id = '{テスターのサロンID}';
```

### 「予約確認も届かない」報告を受けたら

- 暗号化トークンの復号失敗（`ENCRYPTION_KEY` 環境変数の不一致）→ Sentry で確認
- LINE チャネルアクセストークンの有効期限切れ
- `is_active = false`（連携が無効化されている）
- 友だち登録 → 紐付けが完了していない（`customer_line_links.customer_id` が null のまま）

### 「友だち追加してもサロン側に表示されない」報告

- Webhook が機能していない可能性
- LINE Developers Console で Webhook URL が正しく登録されているか
- Webhook 検証エラー（`webhook_secret_encrypted` の不一致）→ Sentry で確認

---

## 既知の問題・今後の予定

### 既知の問題

| 問題 | 影響度 | 対応状況 |
|------|------|--------|
| 前日リマインドが届かない（テスター報告 2026-04-28） | 高 | 切り分け中。ログ確認が必要 |
| 友だち追加後の自動マッピング無し（手動紐付けが必須）| 中 | 設計判断（電話番号での自動マッピングはプライバシー配慮で見送り） |
| 顧客からの返信メッセージへの応答機能なし | 低 | 設計判断（双方向対話は次フェーズ） |
| Cron が落ちた場合の再送機能なし | 中 | リマインドは1日1回しか送信されないので、その日の cron が失敗すると永久に届かない |

### 今後の予定（実装予定 / 未実装）

| 項目 | 状態 | 優先度 |
|------|-----|-------|
| カスタムメッセージ送信（オーナーから顧客へ任意のメッセージ） | 未実装 | 中 |
| 友だち全員へのお知らせ配信（マルチキャスト） | 未実装 | 中 |
| 予約変更・キャンセル通知の LINE 送信 | 未実装（メールのみ） | 中 |
| カウンセリングシート URL の LINE 送信 | 未実装 | 中 |
| Cron リトライ機構（失敗時に2時間後再試行） | 未実装 | 低 |
| LINE 月通数の使用量表示 UI | 未実装 | 低 |
| リッチメニュー（予約変更・キャンセルを LINE から）| 未実装 | 低 |

### Phase 2 で必須対応

- **リマインド未着問題の根本解決**: 上記切り分けで原因特定 → 必要に応じて再送機構追加
- **LINE 通数の使用量モニタリング**: 200通超過時の警告 UI

---

## 関連ファイル

- `18-emails.md` — メール送信（LINE と並行する経路）
- `20-cron-jobs.md` — 前日リマインドの cron 仕様の詳細
- `04-customers.md` — 顧客詳細の LINE 連携セクション
- `12-line-settings.md` — LINE 設定画面（チャネル情報入力・接続テスト UI）
- `15-public-booking.md` — Web予約完了時の LINE 通知トリガー
- `.claude/rules/external-services.md` — LINE Messaging API のプラン制限・障害対応
