"use client";

/**
 * コストシミュレーター — スライダー入力でツール代の節約額をリアルタイム比較
 * GA4 カスタムイベントで匿名の操作データを収集（マーケ分析用）
 */

import { useState, useMemo, useCallback } from "react";
import { ScrollFadeIn } from "./scroll-fade-in";
import { CtaLink } from "./cta-link";
import { trackEvent } from "@/lib/analytics";

const SALON_KARTE_MONTHLY = 2980;

const TOOLS = [
  { id: "hotpepper", label: "ホットペッパー" },
  { id: "reservation", label: "予約管理ツール" },
  { id: "karte", label: "カルテ管理アプリ" },
  { id: "paper", label: "紙・Excel" },
  { id: "line", label: "LINE公式のみ" },
  { id: "none", label: "特になし" },
];

/* ────────── スライダー入力（共通パーツ） ────────── */

function SliderInput({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number;
  step: number; suffix: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold tabular-nums">
          {value.toLocaleString()}
          <span className="text-sm font-normal text-text-light ml-0.5">{suffix}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full h-2 accent-accent cursor-pointer"
      />
    </div>
  );
}

/* ────────── メインコンポーネント ────────── */

export function CostSimulator() {
  const [customers, setCustomers] = useState(3);
  const [price, setPrice] = useState(8000);
  const [days, setDays] = useState(22);
  const [cost, setCost] = useState(10000);
  const [tools, setTools] = useState<string[]>([]);

  const result = useMemo(() => {
    const monthly = customers * price * days;
    const annualSaving = (cost - SALON_KARTE_MONTHLY) * 12;
    return { monthly, annualSaving };
  }, [customers, price, days, cost]);

  const toggleTool = useCallback((id: string) => {
    setTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  }, []);

  /* CTA クリック時に GA4 へ匿名データ送信 */
  const handleCtaClick = useCallback(() => {
    trackEvent({
      name: "simulator_complete",
      params: {
        daily_customers: customers, avg_price: price,
        working_days: days, current_cost: cost,
        tools: tools.join(","), annual_savings: result.annualSaving,
      },
    });
  }, [customers, price, days, cost, tools, result.annualSaving]);

  const fmt = (n: number) => n.toLocaleString("ja-JP");
  const barPct = (val: number, ref: number) =>
    `${Math.max((val / Math.max(ref, 1)) * 100, 4)}%`;
  const barMax = Math.max(cost, SALON_KARTE_MONTHLY);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance [word-break:auto-phrase]">
              いくら節約できる？
            </h2>
            <p className="text-text-light text-lg text-pretty [word-break:auto-phrase]">
              あなたのサロンの数字で、かんたんシミュレーション
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay={100}>
          <div className="bg-[#F5F1ED] rounded-2xl p-6 md:p-8">
            {/* ── 入力エリア ── */}
            <div className="space-y-5 mb-8">
              <SliderInput label="1日の平均施術人数" value={customers}
                min={1} max={10} step={1} suffix="人" onChange={setCustomers} />
              <SliderInput label="平均客単価" value={price}
                min={3000} max={30000} step={1000} suffix="円" onChange={setPrice} />
              <SliderInput label="月の営業日数" value={days}
                min={15} max={28} step={1} suffix="日" onChange={setDays} />

              {/* ツール選択（GA4 データ収集用） */}
              <div>
                <p className="text-sm font-medium mb-2">今お使いのツール（複数可）</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TOOLS.map(t => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 min-h-[44px] cursor-pointer border border-border hover:border-accent/40 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                    >
                      <input
                        type="checkbox"
                        checked={tools.includes(t.id)}
                        onChange={() => toggleTool(t.id)}
                        className="accent-accent w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm leading-tight">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <SliderInput label="ツール月額費用（合計）" value={cost}
                min={0} max={50000} step={1000} suffix="円" onChange={setCost} />
            </div>

            {/* ── 結果エリア ── */}
            <div className="border-t border-border/50 pt-6 space-y-5">
              {/* 月間売上 */}
              <div className="text-center">
                <p className="text-sm text-text-light mb-1">あなたの月間売上（税込概算）</p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums">
                  {fmt(result.monthly)}
                  <span className="text-base font-normal text-text-light ml-1">円</span>
                </p>
              </div>

              {/* コスト比較バー */}
              <div className="bg-white rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-text-light">ツール代の比較</h3>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>今のツール</span>
                    <span className="font-bold tabular-nums">
                      {fmt(cost)}円<span className="text-xs text-text-light font-normal ml-1">/ 月</span>
                    </span>
                  </div>
                  <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                    <div className="h-full bg-text-light/40 rounded-full transition-all duration-300"
                      style={{ width: barPct(cost, barMax) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-accent">サロンカルテ</span>
                    <span className="font-bold text-accent tabular-nums">
                      2,980円<span className="text-xs text-text-light font-normal ml-1">/ 月</span>
                    </span>
                  </div>
                  <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: barPct(SALON_KARTE_MONTHLY, barMax) }} />
                  </div>
                </div>
              </div>

              {/* 節約額 or 時間メリット訴求 */}
              {result.annualSaving > 0 ? (
                <div className="text-center bg-accent/10 rounded-xl p-4">
                  <p className="text-sm text-accent font-medium mb-1">年間の節約額</p>
                  <p className="text-3xl font-bold text-accent tabular-nums">
                    {fmt(result.annualSaving)}
                    <span className="text-base font-normal ml-1">円おトク</span>
                  </p>
                </div>
              ) : cost === 0 ? (
                <div className="text-center bg-accent/10 rounded-xl p-4">
                  <p className="text-sm leading-relaxed">
                    紙やExcelの管理は毎月5〜10時間の事務作業が発生。
                    <br className="hidden sm:inline" />
                    <span className="font-medium text-accent">
                      月額2,980円で、その時間をお客様に使えます。
                    </span>
                  </p>
                </div>
              ) : null}

              {/* CTA */}
              <div className="pt-2">
                <CtaLink
                  href="/signup"
                  trackingLocation="cost_simulator"
                  trackingLabel="無料ではじめる"
                  onClick={handleCtaClick}
                  className="block w-full bg-accent hover:bg-accent-light text-white font-bold rounded-2xl py-4 text-center text-lg transition-colors min-h-[56px]"
                >
                  無料ではじめる
                </CtaLink>
                <div className="text-xs text-text-light mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <span className="whitespace-nowrap">初期費用0円</span>
                  <span className="text-text-light/50" aria-hidden>/</span>
                  <span className="whitespace-nowrap">クレジットカード不要</span>
                  <span className="text-text-light/50" aria-hidden>/</span>
                  <span className="whitespace-nowrap">いつでも解約OK</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
