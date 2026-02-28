"use client";

/**
 * ログインページ用ビジュアル要素
 * Gemini生成のアニメーションSVG（サロンアーチ＋ボタニカル）
 */
export function LoginVisual() {
  return (
    <div className="relative flex flex-col items-center">
      {/* 背景の装飾円 */}
      <div className="absolute -top-8 w-48 h-48 rounded-full bg-accent/[0.07] blur-2xl" />
      <div className="absolute top-4 -left-12 w-32 h-32 rounded-full bg-warning/[0.06] blur-xl" />

      {/* サロンアーチ＋ボタニカルSVG */}
      <svg
        viewBox="0 0 200 160"
        className="w-52 h-auto relative z-10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <style>{`
            .draw-path {
              stroke-dasharray: 300;
              stroke-dashoffset: 300;
              animation: drawPath 2.5s ease-in-out forwards;
            }
            .draw-path-delay {
              stroke-dasharray: 300;
              stroke-dashoffset: 300;
              animation: drawPath 2.5s ease-in-out forwards 0.4s;
            }
            .svg-fade-in {
              opacity: 0;
              animation: svgFadeIn 2s ease-in-out forwards 1.2s;
            }
            .svg-fade-in-slow {
              opacity: 0;
              animation: svgFadeIn 3s ease-in-out forwards 1.8s;
            }
            .svg-float {
              animation: svgFloat 6s ease-in-out infinite;
              transform-origin: center;
            }
            .svg-pulse {
              animation: svgPulse 4s ease-in-out infinite;
              transform-origin: center;
            }
            .svg-pulse-delay {
              animation: svgPulse 4s ease-in-out infinite 2s;
              transform-origin: center;
            }
            .sway-left {
              transform-origin: 50px 140px;
              animation: swayLeft 10s ease-in-out infinite;
            }
            .sway-right {
              transform-origin: 150px 140px;
              animation: swayRight 10s ease-in-out infinite;
            }
            @keyframes drawPath {
              to { stroke-dashoffset: 0; }
            }
            @keyframes svgFadeIn {
              to { opacity: 1; }
            }
            @keyframes svgFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes svgPulse {
              0%, 100% { opacity: 0.2; transform: scale(0.85); }
              50% { opacity: 1; transform: scale(1.15); }
            }
            @keyframes swayLeft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-1.5deg); }
            }
            @keyframes swayRight {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(1.5deg); }
            }
          `}</style>
          <g id="sparkle">
            <path d="M0,-4 Q0,0 4,0 Q0,0 0,4 Q0,0 -4,0 Q0,0 0,-4" fill="#C4956A" />
          </g>
          <path id="leaf-r" d="M0,0 Q6,-7 13,-4 Q7,3 0,0" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.5" />
          <path id="leaf-l" d="M0,0 Q-6,-7 -13,-4 Q-7,3 0,0" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        </defs>

        {/* アーチ背景 */}
        <path className="svg-fade-in" d="M 60 140 L 60 80 A 40 40 0 0 1 140 80 L 140 140 Z" fill="#FAF8F5" opacity="0.7" />
        {/* アーチ外枠 */}
        <path className="draw-path" d="M 50 140 L 50 80 A 50 50 0 0 1 150 80 L 150 140" fill="none" stroke="#C4956A" strokeWidth="0.75" />
        <path className="draw-path-delay" d="M 55 140 L 55 80 A 45 45 0 0 1 145 80 L 145 140" fill="none" stroke="#8B7B6B" strokeWidth="0.5" />
        <path className="svg-fade-in" d="M 60 140 L 60 80 A 40 40 0 0 1 140 80 L 140 140" fill="none" stroke="#C4956A" strokeWidth="0.4" strokeDasharray="2 4" />

        {/* 地面ライン */}
        <g className="svg-fade-in">
          <line x1="30" y1="140" x2="170" y2="140" stroke="#8B7B6B" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="45" y1="143" x2="155" y2="143" stroke="#8B7B6B" strokeWidth="0.25" strokeLinecap="round" />
        </g>

        {/* 中央のアロマランプ */}
        <g className="svg-fade-in svg-float">
          <circle cx="100" cy="85" r="15" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.5" />
          <circle cx="100" cy="85" r="12" fill="none" stroke="#8B7B6B" strokeWidth="0.25" strokeDasharray="1 2" />
          <path d="M 98 81 A 3 3 0 1 1 102 81 L 102.5 90 L 97.5 90 Z" fill="#C4956A" />
          <circle cx="100" cy="80.5" r="1.2" fill="#FAF8F5" />
        </g>

        {/* 左の枝葉 */}
        <g className="sway-left">
          <path className="draw-path" d="M 50 140 C 35 105, 40 65, 65 42" fill="none" stroke="#8B7B6B" strokeWidth="0.5" />
          <path className="draw-path-delay" d="M 55 140 C 45 115, 50 85, 75 65" fill="none" stroke="#C4956A" strokeWidth="0.4" />
          <g className="svg-fade-in-slow">
            <use href="#leaf-l" x="43" y="118" transform="rotate(-15 43 118)" />
            <use href="#leaf-r" x="42" y="92" transform="rotate(-50 42 92)" />
            <use href="#leaf-l" x="47" y="72" transform="rotate(15 47 72)" />
            <use href="#leaf-r" x="55" y="52" transform="rotate(-35 55 52)" />
            <use href="#leaf-l" x="65" y="42" transform="rotate(35 65 42)" />
            <use href="#leaf-r" x="51" y="125" transform="rotate(-25 51 125)" />
            <use href="#leaf-l" x="53" y="102" transform="rotate(10 53 102)" />
            <use href="#leaf-r" x="62" y="82" transform="rotate(-40 62 82)" />
            <use href="#leaf-l" x="75" y="65" transform="rotate(25 75 65)" />
            <circle cx="65" cy="42" r="1.5" fill="#C4956A" />
            <circle cx="75" cy="65" r="1" fill="#8B7B6B" />
          </g>
        </g>

        {/* 右の枝葉 */}
        <g className="sway-right">
          <path className="draw-path" d="M 150 140 C 165 105, 160 65, 135 42" fill="none" stroke="#8B7B6B" strokeWidth="0.5" />
          <path className="draw-path-delay" d="M 145 140 C 155 115, 150 85, 125 65" fill="none" stroke="#C4956A" strokeWidth="0.4" />
          <g className="svg-fade-in-slow">
            <use href="#leaf-r" x="157" y="118" transform="rotate(15 157 118)" />
            <use href="#leaf-l" x="158" y="92" transform="rotate(50 158 92)" />
            <use href="#leaf-r" x="153" y="72" transform="rotate(-15 153 72)" />
            <use href="#leaf-l" x="145" y="52" transform="rotate(35 145 52)" />
            <use href="#leaf-r" x="135" y="42" transform="rotate(-35 135 42)" />
            <use href="#leaf-l" x="149" y="125" transform="rotate(25 149 125)" />
            <use href="#leaf-r" x="147" y="102" transform="rotate(-10 147 102)" />
            <use href="#leaf-l" x="138" y="82" transform="rotate(40 138 82)" />
            <use href="#leaf-r" x="125" y="65" transform="rotate(-25 125 65)" />
            <circle cx="135" cy="42" r="1.5" fill="#C4956A" />
            <circle cx="125" cy="65" r="1" fill="#8B7B6B" />
          </g>
        </g>

        {/* スパークル */}
        <g className="svg-fade-in">
          <g transform="translate(100, 25) scale(1.1)"><use href="#sparkle" className="svg-pulse" /></g>
          <g transform="translate(80, 48) scale(0.8)"><use href="#sparkle" className="svg-pulse-delay" /></g>
          <g transform="translate(125, 45) scale(0.7)"><use href="#sparkle" className="svg-pulse" /></g>
          <g transform="translate(35, 85) scale(0.6)"><use href="#sparkle" className="svg-pulse-delay" /></g>
          <g transform="translate(165, 90) scale(0.9)"><use href="#sparkle" className="svg-pulse" /></g>
          <g transform="translate(68, 115) scale(0.5)"><use href="#sparkle" className="svg-pulse" /></g>
          <g transform="translate(132, 110) scale(0.5)"><use href="#sparkle" className="svg-pulse-delay" /></g>
        </g>
      </svg>

      {/* ブランドロゴ */}
      <h1 className="mt-3 text-3xl font-bold tracking-wide text-primary">
        サロンカルテ
      </h1>
      <p className="mt-1.5 text-sm text-text-light tracking-widest">
        あなたのサロンを、もっとスマートに
      </p>
    </div>
  );
}
