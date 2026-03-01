# LP デザイン・制作ルール

> 調査ドキュメント: `docs/lp-research-*.md` に基づく

## セクション構成ルール
- CTA は最低3箇所（ヒーロー / 料金後 / 最終セクション）+ 固定ヘッダー
- 各セクションは1つの明確な目的を持つ（情報の混在禁止）
- セクション間は `py-16 md:py-24` で統一
- 交互背景（白 / #F5F1ED）で視覚的リズムを作る

## CTA・コンバージョンルール
- メインCTA文言: 「無料ではじめる」（/signup へリンク）
- マイクロコピー: 「初期費用0円 / クレジットカード不要 / いつでも解約OK」
- CTAボタン: `bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-8 py-4 text-lg`
- 固定CTAヘッダー: スクロール600px以降で表示（STORES予約方式）
- 副次CTA: 検討段階では不要（Stage 2 で LINE友だち追加を検討）

## コピーライティングルール
- ターゲット: 個人経営サロンオーナー（ITリテラシー低め、スマホメイン）
- 「SaaS」「クラウド」等の専門用語禁止 → 「スマホアプリ」「ネットで管理」
- 具体的な数値で訴求: 「月額2,980円」「3分で記録」「5分で登録完了」
- 業務シーンに寄り添った表現: 「施術中でもサッと確認」「帰った後に3分で記録」
- ホットペッパー依存の課題に共感（月額掲載料 vs salon-karte 2,980円）

## デザインシステム（LP拡張）

### カラー
- ヒーロー背景: `bg-gradient-to-b from-background to-[#F0ECE8]`
- セクション交互背景: `bg-[#F5F1ED]` と `bg-white`
- アクセントグロー: `rgba(196, 149, 106, 0.15)`
- 既存パレット（accent, background, surface, text, border）をそのまま使用

### タイポグラフィ
- H1（ヒーロー）: `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`
- H2（セクション見出し）: `text-3xl md:text-4xl font-bold`
- H3（カード見出し）: `text-xl md:text-2xl font-bold`
- Body Large: `text-lg leading-relaxed`
- Body: `text-base leading-relaxed`

### スペーシング
- セクション間: `py-16 md:py-24`
- コンテナ: `max-w-5xl mx-auto px-4`
- カード間: `gap-6 md:gap-8`

### レスポンシブ
- md: 768px（モバイル/デスクトップ切替）
- lg: 1024px（サイドバイサイドレイアウト）
- モバイルファースト設計

## 技術ルール
- Server Component 主体（JS バンドル最小化 → INP/LCP 最適化）
- Client Component は固定ヘッダーのみ（スクロール検知が必要なため）
- FAQ アコーディオンは `<details>` + CSS（JS不要）
- 画像: `next/Image` + `priority`（ヒーロー）、`loading="lazy"`（その他）
- フォント: 既存の Hiragino Sans / Noto Sans JP（追加読み込み不要）
- 全画像に width/height 明示（CLS防止）

## SEO ルール
- JSON-LD 構造化データ: `SoftwareApplication` + `FAQPage` + `Organization`
- OGP画像: 1200x630px、Edge Runtime で動的生成
- sitemap.ts: `/`, `/privacy`, `/terms`, `/tokusho`
- robots.ts: `/dashboard/`, `/api/`, `/login/`, `/signup/`, `/setup/` を disallow
- セマンティック HTML: `<section>`, `<article>`, `<nav>`, `<footer>` を適切に使用

## 品質チェック（コミット前）
- 全セクションがモバイル（375px）で崩れないこと
- 全CTAが正しいリンク先を持つこと（/signup）
- フッターの法的リンク（プライバシーポリシー / 利用規約 / 特商法）が正しいこと
- OGP画像が正しく生成されること
- JSON-LD が有効なこと
