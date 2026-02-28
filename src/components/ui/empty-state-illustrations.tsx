/**
 * 空状態用SVGイラスト（6種）
 * Gemini生成のリッチイラスト + ミニマルラインアート
 * stroke="currentColor" で親の text-* クラスから色を継承（シンプル版のみ）
 */

type IllustrationProps = {
  className?: string;
};

/** 顧客一覧 — カードリスト＋プロフィール＋ボタニカル（Gemini生成） */
function CustomerIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .ci-main{stroke:#C4956A;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ci-sub{stroke:#8B7B6B;stroke-width:.8;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ci-float{animation:ciFloat 6s ease-in-out infinite}
          .ci-float-r{animation:ciFloatR 5s ease-in-out infinite}
          .ci-p1{animation:ciPulse 3s ease-in-out infinite}
          .ci-p2{animation:ciPulse 3s ease-in-out infinite 1s}
          .ci-p3{animation:ciPulse 3s ease-in-out infinite 2s}
          .ci-draw{stroke-dasharray:150;animation:ciDraw 2.5s ease-out forwards}
          @keyframes ciFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes ciFloatR{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
          @keyframes ciPulse{0%,100%{opacity:.3}50%{opacity:1}}
          @keyframes ciDraw{0%{stroke-dashoffset:150}100%{stroke-dashoffset:0}}
        `}</style>
      </defs>
      <circle cx="100" cy="80" r="65" fill="#FAF8F5" />
      {/* 枝葉 */}
      <g className="ci-float-r">
        <path d="M 45 130 Q 30 90 60 35" className="ci-sub ci-draw" />
        <path d="M 38 110 Q 25 105 30 95 Q 40 100 38 110" fill="#8B7B6B" opacity="0.6" />
        <path d="M 35 85 Q 22 80 27 70 Q 37 75 35 85" fill="#8B7B6B" opacity="0.6" />
        <path d="M 42 60 Q 35 50 45 40 Q 50 50 42 60" fill="#8B7B6B" opacity="0.6" />
        <path d="M 155 130 Q 170 90 140 35" className="ci-sub ci-draw" />
        <path d="M 162 110 Q 175 105 170 95 Q 160 100 162 110" fill="#8B7B6B" opacity="0.6" />
        <path d="M 165 85 Q 178 80 173 70 Q 163 75 165 85" fill="#8B7B6B" opacity="0.6" />
        <path d="M 158 60 Q 165 50 155 40 Q 150 50 158 60" fill="#8B7B6B" opacity="0.6" />
      </g>
      {/* カードUI */}
      <g transform="translate(60, 30)" className="ci-float">
        <rect x="0" y="0" width="80" height="100" rx="6" fill="#FAF8F5" />
        <rect x="0" y="0" width="80" height="100" rx="6" className="ci-main" />
        <line x1="15" y1="18" x2="65" y2="18" className="ci-main" />
        <g className="ci-p1" transform="translate(0, 32)">
          <circle cx="18" cy="0" r="4" className="ci-sub" />
          <line x1="30" y1="-2" x2="65" y2="-2" className="ci-sub" />
          <line x1="30" y1="4" x2="50" y2="4" className="ci-sub" opacity="0.5" />
        </g>
        <g className="ci-p2" transform="translate(0, 54)">
          <circle cx="18" cy="0" r="4" className="ci-sub" />
          <line x1="30" y1="-2" x2="60" y2="-2" className="ci-sub" />
          <line x1="30" y1="4" x2="45" y2="4" className="ci-sub" opacity="0.5" />
        </g>
        <g className="ci-p3" transform="translate(0, 76)">
          <circle cx="18" cy="0" r="4" className="ci-sub" />
          <line x1="30" y1="-2" x2="65" y2="-2" className="ci-sub" />
          <line x1="30" y1="4" x2="55" y2="4" className="ci-sub" opacity="0.5" />
        </g>
      </g>
      {/* プロフィールアイコン */}
      <g transform="translate(115, 100)" className="ci-float-r">
        <circle cx="16" cy="16" r="14" fill="#FAF8F5" />
        <circle cx="16" cy="16" r="14" className="ci-main" />
        <circle cx="16" cy="11" r="4.5" className="ci-sub" />
        <path d="M 6 23 Q 16 16 26 23" className="ci-sub" />
      </g>
      {/* スパークル */}
      <g fill="#C4956A">
        <circle cx="45" cy="35" r="1" className="ci-p1" />
        <circle cx="145" cy="125" r="1.5" className="ci-p2" />
        <circle cx="150" cy="40" r="1" className="ci-p3" />
        <circle cx="65" cy="120" r="1" className="ci-p1" />
      </g>
    </svg>
  );
}

/** カルテ — 見開きノート＋ペン＋ハーブ（Gemini生成） */
function RecordIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .ri-m{stroke:#C4956A;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ri-s{stroke:#8B7B6B;stroke-width:.75;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ri-float{animation:riF 6s ease-in-out infinite}
          .ri-float-d{animation:riF2 7s ease-in-out infinite 1s}
          .ri-sway{transform-origin:20px 140px;animation:riSway 5s ease-in-out infinite}
          .ri-tw{animation:riTw 4s ease-in-out infinite;transform-origin:center}
          .ri-dl{stroke-dasharray:40}
          .ri-d1{animation:riDraw 6s ease-in-out infinite}
          .ri-d2{animation:riDraw 6s ease-in-out infinite .5s}
          .ri-d3{animation:riDraw 6s ease-in-out infinite 1s}
          @keyframes riF{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes riF2{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes riSway{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}
          @keyframes riTw{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes riDraw{0%,10%{stroke-dashoffset:40;opacity:0}30%,80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        `}</style>
      </defs>
      {/* スパークル */}
      <g fill="#C4956A" className="ri-tw" style={{transformOrigin:"25px 35px"}}>
        <path d="M 20 35 Q 25 35 25 30 Q 25 35 30 35 Q 25 35 25 40 Q 25 35 20 35 Z" />
      </g>
      <g fill="#C4956A" className="ri-tw" style={{transformOrigin:"175px 115px",animationDelay:"2s"}}>
        <path d="M 172 115 Q 175 115 175 112 Q 175 115 178 115 Q 175 115 175 118 Q 175 115 172 115 Z" />
      </g>
      {/* ノート */}
      <g className="ri-float">
        <path d="M 38 118 C 68 118 93 123 98 128" className="ri-s" opacity="0.4" />
        <path d="M 98 128 C 108 123 133 121 162 121 L 162 40" className="ri-s" opacity="0.4" />
        <path d="M 40 35 C 70 35 95 40 100 45 L 100 125 C 95 120 70 115 40 115 Z" fill="#FAF8F5" className="ri-m" />
        <path d="M 100 45 C 105 40 130 35 160 35 L 160 105 C 150 105 145 110 145 120 C 130 118 110 120 100 125 Z" fill="#FAF8F5" className="ri-m" />
        <path d="M 160 105 C 150 105 145 110 145 120 C 148 112 155 108 160 105 Z" fill="#FAF8F5" className="ri-m" />
        <line x1="100" y1="45" x2="100" y2="125" className="ri-s" opacity="0.6" />
        <line x1="98" y1="44" x2="98" y2="124" className="ri-s" opacity="0.2" />
        <line x1="102" y1="46" x2="102" y2="126" className="ri-s" opacity="0.2" />
        {/* 手書き風ライン左 */}
        <path d="M 55 60 Q 70 58 85 62" className="ri-s ri-dl ri-d1" />
        <path d="M 50 75 Q 65 73 85 77" className="ri-s ri-dl ri-d2" />
        <path d="M 55 90 Q 70 88 80 92" className="ri-s ri-dl ri-d3" />
        <path d="M 50 105 Q 60 103 70 106" className="ri-s ri-dl ri-d1" opacity="0.6" />
        {/* 手書き風ライン右 */}
        <path d="M 115 62 Q 130 58 145 60" className="ri-s ri-dl ri-d2" />
        <path d="M 115 77 Q 135 73 145 75" className="ri-s ri-dl ri-d3" />
        <path d="M 115 92 Q 125 88 135 90" className="ri-s ri-dl ri-d1" />
      </g>
      {/* ペン */}
      <g className="ri-float-d">
        <path d="M 143 133 L 170 50 L 174 52 L 147 135 Z" fill="#FAF8F5" className="ri-m" />
        <path d="M 140 140 L 143 133 L 147 135 Z" fill="#C4956A" className="ri-m" />
        <line x1="145" y1="134" x2="172" y2="51" className="ri-s" opacity="0.5" />
        <path d="M 168 60 Q 172 55 178 55" className="ri-m" />
      </g>
      {/* ハーブ */}
      <g className="ri-sway">
        <path d="M 20 140 Q 30 110 60 85" className="ri-m" />
        <path d="M 30 120 Q 20 115 25 105 Q 35 110 30 120" fill="#FAF8F5" className="ri-m" />
        <path d="M 40 100 Q 30 95 35 85 Q 45 90 40 100" fill="#FAF8F5" className="ri-m" />
        <path d="M 50 90 Q 45 80 55 75 Q 60 85 50 90" fill="#FAF8F5" className="ri-m" />
        <path d="M 60 85 Q 65 75 75 80 Q 70 90 60 85" fill="#FAF8F5" className="ri-m" />
        <circle cx="28" cy="102" r="0.8" fill="#8B7B6B" />
        <circle cx="38" cy="82" r="0.8" fill="#8B7B6B" />
        <circle cx="58" cy="72" r="0.8" fill="#8B7B6B" />
      </g>
    </svg>
  );
}

/** カレンダー — 予約・時計・ボタニカル・花（Gemini生成） */
function CalendarIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .ai-m{stroke:#C4956A;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ai-s{stroke:#8B7B6B;stroke-width:.8;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .ai-fm{fill:#C4956A}.ai-fs{fill:#8B7B6B}.ai-fb{fill:#FAF8F5}
          .ai-float{animation:aiFloat 6s ease-in-out infinite}
          .ai-pulse{animation:aiPulse 2s ease-in-out infinite;transform-origin:center}
          .ai-rmin{animation:aiRMin 45s linear infinite;transform-origin:100px 80px}
          .ai-rhr{animation:aiRHr 45s linear infinite;transform-origin:100px 80px}
          .ai-tw1{animation:aiTw 3s ease-in-out infinite}
          .ai-tw2{animation:aiTw 4s ease-in-out infinite 1s}
          .ai-tw3{animation:aiTw 3.5s ease-in-out infinite .5s}
          .ai-sl{animation:aiSwL 7s ease-in-out infinite;transform-origin:20px 140px}
          .ai-sr{animation:aiSwR 8s ease-in-out infinite;transform-origin:180px 140px}
          @keyframes aiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes aiPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
          @keyframes aiRMin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
          @keyframes aiRHr{0%{transform:rotate(0)}100%{transform:rotate(30deg)}}
          @keyframes aiTw{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes aiSwL{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}
          @keyframes aiSwR{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}
        `}</style>
        <g id="ai-flower">
          <path d="M 0 -4 C 2 -7 5 -3 1 -1 C 5 -3 7 0 3 1 C 6 4 2 6 0 2 C -2 6 -6 4 -3 1 C -7 0 -5 -3 -1 -1 C -5 -3 -2 -7 0 -4 Z" className="ai-fb ai-m" />
          <circle cx="0" cy="0" r="1.5" className="ai-fm" />
        </g>
      </defs>
      {/* 背景時計モチーフ */}
      <g opacity="0.4">
        <circle cx="100" cy="80" r="60" className="ai-s" strokeDasharray="2 6" />
        <circle cx="100" cy="80" r="50" className="ai-s" opacity="0.2" />
        <g className="ai-rmin">
          <line x1="100" y1="80" x2="100" y2="35" className="ai-s" />
          <circle cx="100" cy="35" r="1.5" className="ai-fs" />
        </g>
        <g className="ai-rhr">
          <line x1="100" y1="80" x2="125" y2="80" className="ai-s" />
          <circle cx="125" cy="80" r="1.5" className="ai-fs" />
        </g>
        <circle cx="100" cy="80" r="2.5" className="ai-fb ai-s" />
      </g>
      {/* 枝葉（左） */}
      <g className="ai-sl">
        <path d="M 20 130 Q 10 80 45 35" className="ai-s" opacity="0.6" />
        <path d="M 18 105 Q 10 100 15 90 Q 22 95 18 105" className="ai-fb ai-s" />
        <path d="M 25 80 Q 35 75 30 65 Q 22 70 25 80" className="ai-fb ai-s" />
        <path d="M 38 55 Q 30 50 35 40 Q 42 45 38 55" className="ai-fb ai-s" />
      </g>
      {/* 枝葉（右） */}
      <g className="ai-sr">
        <path d="M 180 130 Q 190 80 155 35" className="ai-s" opacity="0.6" />
        <path d="M 182 105 Q 190 100 185 90 Q 178 95 182 105" className="ai-fb ai-s" />
        <path d="M 175 80 Q 165 75 170 65 Q 178 70 175 80" className="ai-fb ai-s" />
        <path d="M 162 55 Q 170 50 165 40 Q 158 45 162 55" className="ai-fb ai-s" />
      </g>
      {/* 花 */}
      <g className="ai-tw1" transform="translate(40, 40) scale(0.9)"><use href="#ai-flower" /></g>
      <g className="ai-tw2" transform="translate(160, 110) scale(1)"><use href="#ai-flower" /></g>
      <g className="ai-tw3" transform="translate(150, 35) scale(0.8)"><use href="#ai-flower" /></g>
      <g className="ai-tw1" transform="translate(45, 120) scale(0.85)"><use href="#ai-flower" /></g>
      {/* スパークル */}
      <circle cx="70" cy="25" r="1" className="ai-fm ai-tw2" />
      <circle cx="130" cy="135" r="1.5" className="ai-fm ai-tw3" />
      {/* カレンダー本体 */}
      <g className="ai-float">
        <rect x="65" y="45" width="70" height="75" rx="8" className="ai-fb ai-m" />
        <path d="M 65 65 L 135 65" className="ai-m" />
        <rect x="76" y="38" width="4" height="14" rx="2" className="ai-fb ai-m" />
        <rect x="120" y="38" width="4" height="14" rx="2" className="ai-fb ai-m" />
        <line x1="78" y1="42" x2="78" y2="48" className="ai-s" opacity="0.5" />
        <line x1="122" y1="42" x2="122" y2="48" className="ai-s" opacity="0.5" />
        {/* 日付ドット */}
        <g opacity="0.4">
          <circle cx="76" cy="78" r="1.2" className="ai-fs" />
          <circle cx="88" cy="78" r="1.2" className="ai-fs" />
          <circle cx="100" cy="78" r="1.2" className="ai-fs" />
          <circle cx="112" cy="78" r="1.2" className="ai-fs" />
          <circle cx="124" cy="78" r="1.2" className="ai-fs" />
          <circle cx="76" cy="90" r="1.2" className="ai-fs" />
          <circle cx="88" cy="90" r="1.2" className="ai-fs" />
          <circle cx="112" cy="90" r="1.2" className="ai-fs" />
          <circle cx="124" cy="90" r="1.2" className="ai-fs" />
          <circle cx="76" cy="102" r="1.2" className="ai-fs" />
          <circle cx="88" cy="102" r="1.2" className="ai-fs" />
          <circle cx="100" cy="102" r="1.2" className="ai-fs" />
          <circle cx="112" cy="102" r="1.2" className="ai-fs" />
          <circle cx="124" cy="102" r="1.2" className="ai-fs" />
        </g>
        {/* ハイライト日付（ハート） */}
        <g transform="translate(100, 89)">
          <path d="M 0 3.5 C -4 -0.5 -7 -3 -4 -6 C -2.5 -7.5 0 -6 0 -4.5 C 0 -6 2.5 -7.5 4 -6 C 7 -3 4 -0.5 0 3.5 Z" className="ai-fm ai-pulse" />
        </g>
      </g>
    </svg>
  );
}

/** ショッピングバッグ — 物販、在庫、商品、棚卸し */
function ProductIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.06" />
      <path d="M14 18h20l-2 18H16L14 18z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M18 18v-3a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 26c1.5 2 6.5 2 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** 売上レポート — 成長グラフ＋花＋葉（Gemini生成） */
function ChartIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .sr-m{stroke:#C4956A;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .sr-s{stroke:#8B7B6B;stroke-width:.8;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .sr-bg{stroke:#FAF8F5;stroke-linecap:round;fill:none}
          .sr-fm{fill:#C4956A}.sr-fs{fill:#8B7B6B}.sr-fb{fill:#FAF8F5}
          .sr-sway{animation:srSway 6s ease-in-out infinite;transform-origin:25px 135px}
          .sr-aura{animation:srAura 4s ease-in-out infinite;transform-origin:145px 35px}
          .sr-tw{animation:srTw 3s ease-in-out infinite;transform-origin:center}
          .sr-float{animation:srFloat 5s ease-in-out infinite}
          .sr-trace{stroke-dasharray:15 200;animation:srTrace 3.5s ease-in-out infinite;opacity:.8}
          @keyframes srSway{0%,100%{transform:rotate(0)}50%{transform:rotate(1.5deg)}}
          @keyframes srAura{0%,100%{transform:scale(1);opacity:.04}50%{transform:scale(1.05);opacity:.08}}
          @keyframes srTw{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes srFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes srTrace{0%{stroke-dashoffset:200;opacity:0}10%{opacity:1}80%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        `}</style>
        <path id="sr-star" d="M 0 -3 Q 0 0 3 0 Q 0 0 0 3 Q 0 0 -3 0 Q 0 0 0 -3 Z" className="sr-fm" />
        <path id="sr-leaf" d="M 0 0 C -2 -3, -4 -1, -3 2 C -1 4, 2 3, 0 0" className="sr-fm" />
      </defs>
      {/* オーラ */}
      <circle cx="145" cy="35" r="35" className="sr-fm sr-aura" />
      <circle cx="145" cy="35" r="20" className="sr-fm sr-aura" style={{animationDelay:"-2s"}} />
      {/* グラフ軸 */}
      <g className="sr-s" opacity="0.4">
        <g opacity="0.5" strokeDasharray="1 4">
          <line x1="25" y1="105" x2="170" y2="105" />
          <line x1="25" y1="75" x2="170" y2="75" />
          <line x1="25" y1="45" x2="170" y2="45" />
        </g>
        <line x1="25" y1="20" x2="25" y2="135" />
        <polyline points="22,25 25,20 28,25" />
        <line x1="25" y1="135" x2="175" y2="135" />
        <polyline points="170,132 175,135 170,138" />
      </g>
      {/* 背景トレンド線 */}
      <path d="M 25 135 C 60 125, 100 115, 140 100" className="sr-s" opacity="0.3" strokeDasharray="2 4" />
      {/* メイン植物グラフ */}
      <g className="sr-sway">
        <path d="M 25 135 C 70 130, 100 85, 145 35" className="sr-m" />
        <path d="M 25 135 C 70 130, 100 85, 145 35" className="sr-m sr-trace" strokeWidth="2" />
        {/* 葉 */}
        <path d="M 55 122 C 45 115, 40 105, 45 100 C 52 103, 58 110, 55 122" className="sr-fb sr-m" />
        <path d="M 95 92 C 105 82, 115 82, 120 87 C 115 95, 105 97, 95 92" className="sr-fb sr-m" />
        <path d="M 120 62 C 110 55, 105 45, 110 40 C 118 45, 122 55, 120 62" className="sr-fb sr-m" />
        {/* 頂点の花 */}
        <g transform="translate(145, 35) rotate(15)">
          <path d="M 0 0 C -8 -12, -15 -15, -10 -22 C -5 -25, 0 -15, 0 0" className="sr-fb sr-m" />
          <path d="M 0 0 C 8 -12, 15 -15, 10 -22 C 5 -25, 0 -15, 0 0" className="sr-fb sr-m" />
          <path d="M 0 0 C -6 -15, -4 -25, 0 -28 C 4 -25, 6 -15, 0 0" className="sr-fm sr-m" />
          <path d="M 0 0 C -12 -5, -18 -2, -16 4 C -10 6, -5 2, 0 0" className="sr-fb sr-m" />
          <path d="M 0 0 C 12 -5, 18 -2, 16 4 C 10 6, 5 2, 0 0" className="sr-fb sr-m" />
          <path d="M 0 0 L -2 -12 M 0 0 L 2 -12 M 0 0 L 0 -14" className="sr-bg" strokeWidth="0.8" />
        </g>
      </g>
      {/* スパークル */}
      <g transform="translate(125, 20)"><use href="#sr-star" className="sr-tw" /></g>
      <g transform="translate(165, 45)"><use href="#sr-star" className="sr-tw" style={{animationDelay:"1s"}} /></g>
      <g transform="translate(155, 15) scale(1.2)"><use href="#sr-star" className="sr-tw" style={{animationDelay:"2s"}} /></g>
      <g transform="translate(80, 70)"><use href="#sr-star" className="sr-tw" style={{animationDelay:".5s"}} /></g>
      {/* 浮遊する小さな葉 */}
      <g className="sr-float"><use href="#sr-leaf" transform="translate(60, 60)" opacity="0.4" /></g>
      <g className="sr-float" style={{animationDelay:"1.5s"}}><use href="#sr-leaf" transform="translate(110, 30) rotate(45) scale(0.8)" opacity="0.5" /></g>
      <g className="sr-float" style={{animationDelay:".7s"}}><use href="#sr-leaf" transform="translate(160, 80) rotate(-30) scale(1.2)" opacity="0.3" /></g>
    </svg>
  );
}

/** 設定 — 花歯車＋サロン窓＋ボタニカル（Gemini生成） */
function ClipboardIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .si-m{stroke:#C4956A;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .si-s{stroke:#8B7B6B;stroke-width:.8;stroke-linecap:round;stroke-linejoin:round;fill:none}
          .si-fm{fill:#C4956A}.si-fs{fill:#8B7B6B}.si-fb{fill:#FAF8F5}
          .si-float{animation:siFloat 6s ease-in-out infinite}
          .si-spin{animation:siSpin 24s linear infinite;transform-origin:0 0}
          .si-spinr{animation:siSpinR 20s linear infinite;transform-origin:0 0}
          .si-tw{animation:siTw 3s ease-in-out infinite}
          .si-sl{animation:siSwL 7s ease-in-out infinite;transform-origin:25px 140px}
          .si-sr{animation:siSwR 8s ease-in-out infinite;transform-origin:175px 140px}
          @keyframes siFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes siSpin{100%{transform:rotate(360deg)}}
          @keyframes siSpinR{100%{transform:rotate(-360deg)}}
          @keyframes siTw{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes siSwL{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}}
          @keyframes siSwR{0%,100%{transform:rotate(0)}50%{transform:rotate(-3deg)}}
        `}</style>
        <path id="si-petal" d="M -3 -24 L -4 -34 C -2 -38 2 -38 4 -34 L 3 -24" className="si-fb si-m" />
        <g id="si-gear">
          <use href="#si-petal" />
          <use href="#si-petal" transform="rotate(45)" />
          <use href="#si-petal" transform="rotate(90)" />
          <use href="#si-petal" transform="rotate(135)" />
          <use href="#si-petal" transform="rotate(180)" />
          <use href="#si-petal" transform="rotate(225)" />
          <use href="#si-petal" transform="rotate(270)" />
          <use href="#si-petal" transform="rotate(315)" />
          <circle cx="0" cy="0" r="24" className="si-fb si-m" />
          <circle cx="0" cy="0" r="18" className="si-s" strokeDasharray="2 4" />
        </g>
        <path id="si-star" d="M 0 -4 Q 0 0 4 0 Q 0 0 0 4 Q 0 0 -4 0 Q 0 0 0 -4 Z" className="si-fm" />
      </defs>
      {/* 枝葉（左） */}
      <g className="si-sl">
        <path d="M 25 140 Q 15 80 55 30" className="si-s" opacity="0.6" />
        <path d="M 22 110 Q 12 105 18 95 Q 25 100 22 110" className="si-fb si-s" />
        <path d="M 32 85 Q 42 80 36 70 Q 28 75 32 85" className="si-fb si-s" />
        <path d="M 42 55 Q 32 50 38 40 Q 46 45 42 55" className="si-fb si-s" />
      </g>
      {/* 枝葉（右） */}
      <g className="si-sr">
        <path d="M 175 140 Q 185 80 145 30" className="si-s" opacity="0.6" />
        <path d="M 178 110 Q 188 105 182 95 Q 175 100 178 110" className="si-fb si-s" />
        <path d="M 168 85 Q 158 80 164 70 Q 172 75 168 85" className="si-fb si-s" />
        <path d="M 158 55 Q 168 50 162 40 Q 154 45 158 55" className="si-fb si-s" />
      </g>
      {/* 背景小歯車 */}
      <g transform="translate(45, 115) scale(0.4)" className="si-float" style={{animationDelay:"1s",opacity:0.7}}>
        <g className="si-spinr"><use href="#si-gear" /></g>
      </g>
      <g transform="translate(155, 45) scale(0.35)" className="si-float" style={{animationDelay:"2s",opacity:0.7}}>
        <g className="si-spin"><use href="#si-gear" /></g>
      </g>
      {/* スパークル */}
      <use href="#si-star" x="55" y="40" className="si-tw" style={{transformOrigin:"55px 40px"}} />
      <use href="#si-star" x="145" y="115" className="si-tw" style={{animationDelay:"1.5s",transformOrigin:"145px 115px"}} />
      <use href="#si-star" x="135" y="35" className="si-tw" style={{animationDelay:".7s",transformOrigin:"135px 35px"}} />
      {/* メイン歯車＋サロン窓 */}
      <g className="si-float" transform="translate(100, 80)">
        <circle cx="0" cy="0" r="42" className="si-s" strokeDasharray="1 6" opacity="0.4" />
        <g className="si-spin"><use href="#si-gear" /></g>
        {/* サロン窓（静止） */}
        <g>
          <rect x="-10" y="-6" width="20" height="14" className="si-fb si-m" />
          <line x1="0" y1="-6" x2="0" y2="8" className="si-s" />
          <line x1="-10" y1="1" x2="10" y2="1" className="si-s" />
          <path d="M -14 -6 L -12 -14 L 12 -14 L 14 -6 Q 10.5 -3 7 -6 Q 3.5 -3 0 -6 Q -3.5 -3 -7 -6 Q -10.5 -3 -14 -6 Z" className="si-fm si-m" />
          <line x1="-13" y1="8" x2="13" y2="8" className="si-m" strokeWidth="1.5" />
          <polygon points="-8,8 -7,4 -3,4 -2,8" className="si-fs" />
          <circle cx="-6" cy="2" r="1.5" className="si-fm" />
          <circle cx="-4" cy="0" r="2" className="si-fm" />
          <circle cx="-2" cy="2" r="1.5" className="si-fm" />
        </g>
      </g>
    </svg>
  );
}

// --- 公開コンポーネント ---

export type IllustrationType = "customer" | "record" | "calendar" | "product" | "chart" | "clipboard";

const illustrations: Record<IllustrationType, React.FC<IllustrationProps>> = {
  customer: CustomerIllustration,
  record: RecordIllustration,
  calendar: CalendarIllustration,
  product: ProductIllustration,
  chart: ChartIllustration,
  clipboard: ClipboardIllustration,
};

type Props = {
  type: IllustrationType;
  size?: "sm" | "md";
};

/** イラスト表示コンポーネント（EmptyStateから呼ばれる） */
export function EmptyStateIllustration({ type, size = "sm" }: Props) {
  const Component = illustrations[type];
  // Gemini版はビューポートが大きいため別サイズ
  const isRich = type === "customer" || type === "record" || type === "calendar" || type === "chart" || type === "clipboard";
  const sizeClass = isRich
    ? (size === "md" ? "w-40 h-auto" : "w-28 h-auto")
    : (size === "md" ? "w-16 h-16" : "w-12 h-12");

  return (
    <div className={`${sizeClass} mx-auto mb-3 ${isRich ? "" : "text-accent"}`}>
      <Component className="w-full h-full" />
    </div>
  );
}
