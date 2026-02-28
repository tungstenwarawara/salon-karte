/**
 * ダッシュボード挨拶セクション用ビジュアル
 * Gemini生成: ノート＋コーヒー＋花のモチーフ（サロンオーナーの朝）
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
          .gl-draw{stroke-dasharray:200;stroke-dashoffset:200;animation:glDraw 2s ease-out forwards}
          .gl-draw-d1{stroke-dasharray:100;stroke-dashoffset:100;animation:glDraw 1.5s ease-out forwards .5s}
          .gl-draw-d2{stroke-dasharray:100;stroke-dashoffset:100;animation:glDraw 1.5s ease-out forwards .8s}
          .gl-draw-d3{stroke-dasharray:100;stroke-dashoffset:100;animation:glDraw 1.5s ease-out forwards 1.1s}
          .gl-fade{opacity:0;animation:glFade 1.5s ease-out forwards .3s}
          .gl-fade-slow{opacity:0;animation:glFade 2s ease-out forwards 1.5s}
          .gl-steam{opacity:0;transform-origin:center bottom;animation:glRise 4s ease-in-out infinite}
          .gl-steam-1{animation-delay:.5s}
          .gl-steam-2{animation-delay:2s;animation-duration:4.5s}
          .gl-steam-3{animation-delay:3.2s;animation-duration:5s}
          .gl-sparkle{transform-origin:center;animation:glPulse 3s ease-in-out infinite}
          .gl-sparkle-d{transform-origin:center;animation:glPulse 3s ease-in-out infinite 1.5s}
          @keyframes glDraw{to{stroke-dashoffset:0}}
          @keyframes glFade{to{opacity:1}}
          @keyframes glRise{0%{opacity:0;transform:translateY(0) scaleX(.9)}40%{opacity:.6}100%{opacity:0;transform:translateY(-15px) scaleX(1.2)}}
          @keyframes glPulse{0%,100%{opacity:.3;transform:scale(.8) rotate(0)}50%{opacity:1;transform:scale(1.1) rotate(45deg)}}
        `}</style>
        <g id="gl-sparkle">
          <path d="M0,-3 Q0,0 3,0 Q0,0 0,3 Q0,0 -3,0 Q0,0 0,-3" fill="#C4956A" />
        </g>
        <path id="gl-leaf" d="M0,0 Q5,-6 10,-2 Q4,4 0,0" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.4" />
      </defs>

      {/* 背景楕円 */}
      <ellipse cx="120" cy="50" rx="100" ry="40" fill="#FAF8F5" opacity="0.6" className="gl-fade" />

      {/* ノートブック */}
      <g transform="translate(80, 55) rotate(-6)">
        <rect x="-50" y="-30" width="100" height="65" rx="4" fill="#8B7B6B" opacity="0.06" transform="translate(3, 4)" />
        <rect className="gl-draw" x="-50" y="-30" width="100" height="65" rx="3" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        <rect className="gl-fade" x="-47" y="-27" width="94" height="59" rx="1.5" fill="none" stroke="#C4956A" strokeWidth="0.2" strokeDasharray="1 2" />
        <line className="gl-fade" x1="-40" y1="-30" x2="-40" y2="35" stroke="#8B7B6B" strokeWidth="0.4" />
        <circle cx="-45" cy="-20" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" className="gl-fade" />
        <circle cx="-45" cy="0" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" className="gl-fade" />
        <circle cx="-45" cy="20" r="1.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.4" className="gl-fade" />
        <line className="gl-draw-d1" x1="-25" y1="-12" x2="35" y2="-12" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
        <line className="gl-draw-d2" x1="-25" y1="0" x2="25" y2="0" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
        <line className="gl-draw-d3" x1="-25" y1="12" x2="40" y2="12" stroke="#8B7B6B" strokeWidth="0.4" strokeLinecap="round" />
      </g>

      {/* コーヒーカップ */}
      <g transform="translate(175, 62)">
        <ellipse cx="2" cy="16" rx="28" ry="9" fill="#8B7B6B" opacity="0.08" className="gl-fade" />
        <ellipse cx="0" cy="14" rx="28" ry="9" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" className="gl-draw" />
        <ellipse cx="0" cy="14" rx="18" ry="5" fill="none" stroke="#C4956A" strokeWidth="0.3" className="gl-fade-slow" />
        <path className="gl-draw-d1" d="M 16,0 C 26,-2 28,10 14,10" fill="none" stroke="#8B7B6B" strokeWidth="0.6" strokeLinecap="round" />
        <path className="gl-fade" d="M -17,2 C -17,16 17,16 17,2 L 17,-3 C 17,-6 -17,-6 -17,-3 Z" fill="#FAF8F5" stroke="#8B7B6B" strokeWidth="0.5" />
        <ellipse className="gl-draw" cx="0" cy="-3" rx="17" ry="5.5" fill="#FAF8F5" stroke="#C4956A" strokeWidth="0.6" />
        <ellipse className="gl-fade-slow" cx="0" cy="-3" rx="14" ry="4" fill="#C4956A" opacity="0.85" />
        {/* 湯気 */}
        <g strokeLinecap="round" fill="none">
          <path className="gl-steam gl-steam-1" d="M -4,-12 C -10,-20 2,-28 -4,-38" stroke="#8B7B6B" strokeWidth="0.5" />
          <path className="gl-steam gl-steam-2" d="M 4,-10 C 12,-18 -2,-26 5,-35" stroke="#C4956A" strokeWidth="0.4" />
          <path className="gl-steam gl-steam-3" d="M -1,-15 C -6,-22 4,-30 0,-40" stroke="#8B7B6B" strokeWidth="0.3" />
        </g>
      </g>

      {/* 枝＋花 */}
      <g transform="translate(100, 50)">
        <path className="gl-draw" d="M -50,25 C -20,20 -5,5 20,-15" fill="none" stroke="#8B7B6B" strokeWidth="0.5" strokeLinecap="round" />
        <g className="gl-fade-slow">
          <use href="#gl-leaf" x="-35" y="18" transform="rotate(-20 -35 18) scale(0.9)" />
          <use href="#gl-leaf" x="-20" y="10" transform="rotate(160 -20 10) scale(0.8)" />
          <use href="#gl-leaf" x="-5" y="2" transform="rotate(-10 -5 2) scale(1)" />
          <use href="#gl-leaf" x="10" y="-8" transform="rotate(170 10 -8) scale(0.7)" />
        </g>
        <g className="gl-fade-slow" transform="translate(20, -15) rotate(15)">
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

      {/* スパークル */}
      <g className="gl-fade-slow">
        <use href="#gl-sparkle" x="140" y="30" className="gl-sparkle" transform="scale(0.8)" />
        <use href="#gl-sparkle" x="210" y="45" className="gl-sparkle-d" transform="scale(0.6)" />
        <use href="#gl-sparkle" x="40" y="40" className="gl-sparkle" transform="scale(0.9)" />
        <use href="#gl-sparkle" x="85" y="15" className="gl-sparkle-d" transform="scale(0.5)" />
        <use href="#gl-sparkle" x="180" y="90" className="gl-sparkle" transform="scale(0.7)" />
      </g>
    </svg>
  );
}
