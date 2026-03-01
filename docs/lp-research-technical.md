# LP 技術ベストプラクティス

> 調査日: 2026-03-01
> スタック: Next.js 15 (App Router) + Tailwind CSS 4

---

## 1. Core Web Vitals 最適化

### 目標値
| 指標 | 目標 | 説明 |
|------|------|------|
| LCP | <= 2.5s | Largest Contentful Paint |
| INP | <= 200ms | Interaction to Next Paint（FIDの後継） |
| CLS | < 0.1 | Cumulative Layout Shift |

### LCP 最適化
- ヒーロー画像に `priority` + `placeholder="blur"` を付与
- `next/font` でフォントをセルフホスト（外部リクエスト排除）
- Server Component 主体で JS バンドル最小化

### CLS 最適化
- 全画像に width/height 明示
- `next/font` の `adjustFontFallback` で自動 size-adjust
- 動的コンテンツ（FAQ等）に min-height 確保

### INP 最適化
- LP は Server Component 主体 → JS バンドル最小
- Client Component は固定ヘッダーとアニメーション部分のみ
- 重いコンポーネントは `dynamic()` で遅延ロード

---

## 2. SEO 実装

### sitemap.ts
```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://salonkarte.com";
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/tokusho`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
```

### robots.ts
```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/login/", "/signup/", "/setup/"],
    },
    sitemap: "https://salonkarte.com/sitemap.xml",
  };
}
```

### JSON-LD 構造化データ
- `SoftwareApplication`: アプリ情報（名前、価格、カテゴリ）
- `FAQPage`: FAQ セクション（リッチスニペット表示）
- `Organization`: 運営者情報

### OGP画像
- `opengraph-image.tsx` で Edge Runtime 動的生成
- サイズ: 1200x630px
- Noto Sans JP Bold でテキスト描画

---

## 3. Framer Motion アニメーションパターン集

### パターン1: スクロールフェードイン（最頻出）
```tsx
"use client";
import { motion } from "motion/react";

function FadeInOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### パターン2: ヒーローアニメーション
```tsx
<motion.h1
  initial={{ opacity: 0, x: -30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
  ヘッドライン
</motion.h1>
```

### パターン3: 数字カウントアップ
```tsx
import { useMotionValue, useTransform, animate, useInView } from "motion/react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) animate(motionValue, target, { duration: 2, ease: "easeOut" });
  }, [isInView]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v.toLocaleString() + suffix;
    });
    return unsubscribe;
  }, [rounded, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}
```

### パターン4: パララックス
```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
```

### パターン5: デバイスモックアップ内スクロール
- `useScroll` + `useTransform` でスクロールに連動してスクショをパン

### パターン6: テスティモニアルカルーセル
- `AnimatePresence` + `mode="wait"` で自動送り（5秒間隔）

### バンドルサイズ削減
```tsx
import { LazyMotion, domAnimation } from "motion/react";
// domAnimation: ~6KB (基本アニメーション)
// domMax: ~15KB (レイアウト含む)
```

---

## 4. コンバージョン向上 UI パターン

### 固定CTAヘッダー
- `useScroll` でスクロール600px以降に表示
- `backdrop-blur-lg` + `bg-white/90` で半透明
- ロゴ + CTAボタン のミニマル構成

### スクロール進捗インジケーター
```tsx
const { scrollYProgress } = useScroll();
<motion.div className="fixed top-0 left-0 right-0 h-1 bg-accent z-50 origin-left"
  style={{ scaleX: scrollYProgress }} />
```

### Exit-intent ポップアップ
- マウスがビューポート上部に出た場合に表示
- sessionStorage で1回のみ表示
- モバイルでは動作しない（代替: スクロールバック検知 or 不実装）

### 「〇〇人が利用中」リアルタイム風表示
- Server Component で件数取得（revalidate: 3600）
- 緑のpingドットで「今も使われている」感を演出

---

## 5. ディレクトリ構成

```
src/app/
├── page.tsx                    ← LP本体（認証チェック: ログイン済み→/dashboard）
├── sitemap.ts
├── robots.ts
├── opengraph-image.tsx
src/components/lp/
├── lp-header.tsx               ← 固定ナビ（スクロール追従CTA）
├── hero-section.tsx
├── problem-section.tsx
├── features-section.tsx
├── screenshot-section.tsx
├── pricing-section.tsx
├── comparison-section.tsx
├── steps-section.tsx
├── faq-section.tsx
├── final-cta-section.tsx
└── lp-footer.tsx
```

---

## 6. デザインシステム（LP拡張）

### LP用カラー拡張
```css
/* ヒーロー背景グラデーション */
--color-hero-start: #FAF8F5;
--color-hero-end: #F0ECE8;

/* アクセントグラデーション（CTAボタン等） */
--color-accent-gradient-start: #C4956A;
--color-accent-gradient-end: #D4AD8A;

/* セクション交互背景 */
--color-section-alt: #F5F1ED;

/* グロー効果 */
--color-glow-accent: rgba(196, 149, 106, 0.15);
```

### タイポグラフィスケール
```
H1: text-4xl md:text-6xl font-bold tracking-tight
H2: text-3xl md:text-4xl font-bold
H3: text-xl md:text-2xl font-bold
Body Large: text-lg leading-relaxed
Body: text-base leading-relaxed
```

### スペーシング
```
セクション間: py-16 md:py-24
セクション内グループ: space-y-8 md:space-y-12
カード間: gap-6 md:gap-8
```

### ブレークポイント
```
md: 768px   → 主要ブレークポイント（モバイル/デスクトップ）
lg: 1024px  → サイドバイサイドレイアウト
xl: 1280px  → max-w-5xl のコンテナ上限
```

---

## 7. 動画の最適な配置

### 形式
- WebM（VP9）を優先、MP4（H.264）をフォールバック
- `<source>` タグの順序で WebM を先に

### 遅延読み込み
- IntersectionObserver で200px手前からロード開始
- `poster` 画像で初期表示を即座に

### 推奨配置
- ヒーローではなく、機能紹介セクションの下に配置
- autoplay + muted + loop + playsInline
- 長さ: 15〜30秒（それ以上は離脱を招く）
