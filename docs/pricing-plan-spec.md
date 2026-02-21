# 料金プラン・機能制限 技術設計書

> 作成日: 2026-02-21
> ステータス: 設計のみ（実装は Phase 8 商用化フェーズ）

---

## 1. プラン定義

| プラン | 用途 | 料金 |
|-------|------|------|
| `tester` | テスター期間（全機能開放・期限なし） | 無料 |
| `trial` | 無料トライアル（将来） | 0円 |
| `basic` | お試しプラン | 0円 |
| `pro` | 基本プラン | 2,980円/月 |

### 各プランの機能制限マトリクス

| 機能 | tester | trial | basic | pro |
|------|--------|-------|-------|-----|
| 顧客登録上限 | 無制限 | 10件 | 10件 | 無制限 |
| 施術カルテ | 無制限 | 無制限 | 無制限 | 無制限 |
| 写真保存 | 5GB | 期間中のみ | なし | 5GB |
| 予約管理 | ○ | 期間中のみ | なし | ○ |
| 物販・回数券 | ○ | ○ | ○ | ○ |
| 売上レポート | ○ | ○ | ○ | ○ |
| 在庫管理 | ○ | なし | なし | オプション(+500円) |
| 確定申告 | ○ | なし | なし | オプション(+500円) |
| 離脱アラート | ○ | ○ | ○ | ○ |

---

## 2. DB設計（マイグレーション案）

### salons テーブルへのカラム追加

```sql
-- 00023_plan_type.sql（商用化時に適用）

ALTER TABLE salons ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'tester'
  CHECK (plan_type IN ('tester', 'trial', 'basic', 'pro'));

ALTER TABLE salons ADD COLUMN plan_started_at TIMESTAMPTZ DEFAULT now();
```

- デフォルト値 `'tester'` → 既存サロンは全機能開放のまま
- `plan_started_at` → trial 期間の計算に使用

### database.ts 型追加（商用化時）

```typescript
// salons.Row に追加
plan_type: 'tester' | 'trial' | 'basic' | 'pro';
plan_started_at: string;
```

---

## 3. 機能ゲートの実装方式

### 3.1 プラン定義ファイル（src/lib/plan.ts）

```typescript
export type PlanType = 'tester' | 'trial' | 'basic' | 'pro';

export type PlanLimits = {
  maxCustomers: number;        // Infinity = 無制限
  photosEnabled: boolean;
  appointmentsEnabled: boolean;
  inventoryEnabled: boolean;
  taxReportEnabled: boolean;
  maxPhotoStorageMB: number;
};

const PLAN_DEFINITIONS: Record<PlanType, PlanLimits> = {
  tester: {
    maxCustomers: Infinity,
    photosEnabled: true,
    appointmentsEnabled: true,
    inventoryEnabled: true,
    taxReportEnabled: true,
    maxPhotoStorageMB: 5120,
  },
  trial: {
    maxCustomers: 10,
    photosEnabled: true,
    appointmentsEnabled: true,
    inventoryEnabled: false,
    taxReportEnabled: false,
    maxPhotoStorageMB: 5120,
  },
  basic: {
    maxCustomers: 10,
    photosEnabled: false,
    appointmentsEnabled: false,
    inventoryEnabled: false,
    taxReportEnabled: false,
    maxPhotoStorageMB: 0,
  },
  pro: {
    maxCustomers: Infinity,
    photosEnabled: true,
    appointmentsEnabled: true,
    inventoryEnabled: true,  // オプション課金後 true に
    taxReportEnabled: true,  // オプション課金後 true に
    maxPhotoStorageMB: 5120,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_DEFINITIONS[planType];
}

export function isFeatureEnabled(
  planType: PlanType,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(planType);
  const value = limits[feature];
  return typeof value === 'boolean' ? value : value > 0;
}
```

### 3.2 Client hook（src/lib/hooks/use-plan.ts）

```typescript
import { getPlanLimits, isFeatureEnabled, type PlanType } from '@/lib/plan';

export function usePlan(planType: PlanType) {
  const limits = getPlanLimits(planType);

  return {
    limits,
    isFeatureEnabled: (feature: keyof typeof limits) =>
      isFeatureEnabled(planType, feature),
    canAddCustomer: (currentCount: number) =>
      currentCount < limits.maxCustomers,
  };
}
```

### 3.3 FeatureGate コンポーネント（src/components/ui/feature-gate.tsx）

```typescript
import { isFeatureEnabled, type PlanType, type PlanLimits } from '@/lib/plan';

type Props = {
  feature: keyof PlanLimits;
  planType: PlanType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({ feature, planType, children, fallback }: Props) {
  if (isFeatureEnabled(planType, feature)) {
    return <>{children}</>;
  }
  return fallback ?? <UpgradePrompt feature={feature} />;
}
```

### 3.4 getAuthAndSalon() への統合

```typescript
// auth-helpers.ts（商用化時に変更）
.select("id, name, phone, address, business_hours, salon_holidays, plan_type, plan_started_at")
```

→ 全ページで plan_type が追加クエリなしで取得可能

---

## 4. 実装しないこと（Phase 8 まで保留）

- Stripe Checkout / Customer Portal 連携
- Webhook による plan_type 自動更新
- RLS ポリシーでの顧客件数ハードリミット
- middleware.ts でのルートレベルブロック
- オプション機能の個別課金管理テーブル

---

## 5. Stripe連携の方針（Phase 8 で実装）

### フロー

```
1. ユーザーが「プランを選択」画面でプランを選ぶ
2. Stripe Checkout Session を作成 → 決済ページへリダイレクト
3. 決済完了 → Stripe Webhook で salons.plan_type を更新
4. 解約/失敗 → plan_type を 'basic' に戻す
```

### 必要なテーブル（Phase 8 で追加）

```sql
-- subscriptions テーブル（Stripe連携用）
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active' | 'trialing' | 'past_due' | 'canceled'
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. テスター全機能開放の仕組み

- `plan_type = 'tester'` がデフォルト値
- tester の PlanLimits は全て無制限/有効
- テスター期間終了時に plan_type を 'basic' or 'pro' に手動/自動更新
- テスター特典: オプション機能は正式リリース後3ヶ月間無料

---

## 7. 参考: 競合との価格比較

| 比較項目 | salon-karte | KaruteKun | Bionly有料 | リザービア |
|---------|------------|-----------|----------|----------|
| 月額 | 2,980円 | 5,500円 | 10,780円 | 21,000円~ |
| 初期費用 | 0円 | 0円 | 0円 | 100,000円 |
| カルテ | 無制限 | ○ | ○ | 簡易 |
| 回数券 | ○ | - | - | - |
| 在庫管理 | +500円 | - | ○ | - |
| 確定申告 | +500円 | - | - | - |

---

## 8. 損益分岐

- ランニングコスト: 約6,800円/月（Supabase + Vercel）
- ブレークイーブン: 3サロン × 2,980円 = 8,940円/月
