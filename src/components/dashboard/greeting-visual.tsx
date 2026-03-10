/**
 * ダッシュボード挨拶セクション用ビジュアル
 * Gemini生成: ノート＋コーヒー＋花のモチーフ（サロンオーナーの朝）
 *
 * パフォーマンス最適化（2026-03-10）:
 * - stroke-dasharray アニメーション排除（メインスレッドブロック回避）
 * - infinite アニメーション排除（湯気・スパークル → 静的表示に変更）
 * - opacity のみの軽量 fade-in に統一（GPU合成レイヤーで処理可能）
 */
export function GreetingVisual() {
  return (
    <svg
      viewBox="0 0 240 100"
      className="w-full h-auto max-w-[280px] mx-auto"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <style>{`
          .gl-fade{opacity:0;animation:glFade .8s ease-out forwards .1s}
          .gl-fade-d1{opacity:0;animation:glFade .8s ease-out forwards .3s}
          .gl-fade-d2{opacity:0;animation:glFade .8s ease-out forwards .5s}
          @keyframes glFade{to{opacity:1}}
          @media(prefers-reduced-motion:reduce){
            .gl-fade,.gl-fade-d1,.gl-fade-d2{opacity:1;animation:none}
          }
        `}</style>
        <g id="gl-sparkle">
          <path d="M0,-3 Q0,0 3,0 Q0,0 0,3 Q0,0 -3,0 Q0,0 0,-3" fill="#C4956A" />
        </g>
        <path id="gl-leaf" d="M0,0 Q5,-6 10,-2 Q4,4 0,0" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.4" />
      </defs>

      {/* 背景楕円 */}
      <ellipse cx="120" cy="50" rx="100" ry="40" fill="#FAF8F5" opacity="0.6" className="gl-fade" />

      {/* ノートブック */}
      <g transform="translate(80, 55) rotate(-6)" className="gl-fade">
        <rect x="-50" y="-30" width="100" height="65" rx="4" fill="#8B7B6B" opacity="0.06" transform="translate(3, 4)" />
        <rect x="-50" y="-30" width="100" height="65" rx="3" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        <rect x="-47" y="-27" width="94" height="59" rx="1.5" fill="none" stroke="#C4956A" strokeWidth="0.2" strokeDasharray="1 2" />
        <line x1="-40" y1="-30" x2="-40" y2="35" stroke="#8B7B6B" strokeWidth="0.4" />
        <circle cx="-45" cy="-20" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
        <circle cx="-45" cy="0" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
        <circle cx="-45" cy="20" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
        <line x1="-25" y1="-12" x2="35" y2="-12" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
        <line x1="-25" y1="0" x2="25" y2="0" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
        <line x1="-25" y1="12" x2="40" y2="12" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
      </g>

      {/* コーヒーカップ */}
      <g transform="translate(175, 62)" className="gl-fade-d1">
        <ellipse cx="2" cy="16" rx="28" ry="9" fill="#8B7B6B" opacity="0.08" />
        <ellipse cx="0" cy="14" rx="28" ry="9" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        <path d="M 16,0 C 26,-2 28,10 14,10" fill="none" stroke="#8B7B6B" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M -17,2 C -17,16 17,16 17,2 L 17,-3 C 17,-6 -17,-6 -17,-3 Z" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        <ellipse cx="0" cy="-3" rx="17" ry="5.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.6" />
        <ellipse cx="0" cy="-3" rx="14" ry="4" fill="#C4956A" opacity="0.85" />
        {/* 湯気（静的表示 — infinite アニメーション排除） */}
        <g strokeLinecap="round" fill="none" opacity="0.35">
          <path d="M -4,-12 C -10,-20 2,-28 -4,-38" stroke="#8B7B6B" strokeWidth="0.5" />
          <path d="M 4,-10 C 12,-18 -2,-26 5,-35" stroke="#C4956A" strokeWidth="0.4" />
          <path d="M -1,-15 C -6,-22 4,-30 0,-40" stroke="#8B7B6B" strokeWidth="0.3" />
        </g>
      </g>

      {/* 枝＋花 */}
      <g transform="translate(100, 50)" className="gl-fade-d2">
        <path d="M -50,25 C -20,20 -5,5 20,-15" fill="none" stroke="#8B7B6B" strokeWidth="0.5" strokeLinecap="round" />
        <g>
          <use href="#gl-leaf" x="-35" y="18" transform="rotate(-20 -35 18) scale(0.9)" />
          <use href="#gl-leaf" x="-20" y="10" transform="rotate(160 -20 10) scale(0.8)" />
          <use href="#gl-leaf" x="-5" y="2" transform="rotate(-10 -5 2) scale(1)" />
          <use href="#gl-leaf" x="10" y="-8" transform="rotate(170 10 -8) scale(0.7)" />
        </g>
        <g transform="translate(20, -15) rotate(15)">
          <path d="M 0,0 C -10,-12 -2,-20 0,-22 C 2,-20 10,-12 0,0 Z" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
          <path d="M 0,0 C -15,-5 -20,2 -18,5 C -15,5 -8,2 0,0 Z" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
          <path d="M 0,0 C 15,-5 20,2 18,5 C 15,5 8,2 0,0 Z" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
          <path d="M 0,0 C -8,10 -2,16 0,18 C 2,16 8,10 0,0 Z" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" />
          <circle cx="0" cy="0" r="1.5" fill="#C4956A" />
          <circle cx="-2" cy="-1.5" r="0.8" fill="#8B7B6B" />
          <circle cx="2" cy="-1" r="0.6" fill="#8B7B6B" />
          <circle cx="0" cy="2" r="0.8" fill="#8B7B6B" />
        </g>
      </g>

      {/* スパークル（静的表示 — infinite アニメーション排除） */}
      <g opacity="0.5" className="gl-fade-d2">
        <use href="#gl-sparkle" x="140" y="30" transform="scale(0.8)" />
        <use href="#gl-sparkle" x="210" y="45" transform="scale(0.6)" />
        <use href="#gl-sparkle" x="40" y="40" transform="scale(0.9)" />
        <use href="#gl-sparkle" x="85" y="15" transform="scale(0.5)" />
        <use href="#gl-sparkle" x="180" y="90" transform="scale(0.7)" />
      </g>
    </svg>
  );
}
