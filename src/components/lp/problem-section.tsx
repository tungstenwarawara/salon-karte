const PROBLEMS = [
  {
    emoji: "📋",
    title: "紙のカルテ、もう限界…",
    body: "お客様が増えるほど探すのに時間がかかる。写真も貼れない。過去の施術内容をすぐに確認できない。",
  },
  {
    emoji: "💸",
    title: "集客サイトの掲載料が高い",
    body: "月額5〜15万円の掲載料。でもリピーターが育たず、新規集客の繰り返し。",
  },
  {
    emoji: "⏰",
    title: "予約管理がバラバラ",
    body: "電話・LINE・DMの予約をそれぞれ管理。ダブルブッキングのヒヤリハット、ありませんか？",
  },
  {
    emoji: "📊",
    title: "確定申告で毎年バタバタ",
    body: "レシートの山、手書きの帳簿。毎年3月に地獄を見る。もっとラクにしたい。",
  },
];

export function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            こんなお悩み、ありませんか？
          </h2>
          <p className="text-text-light text-lg">
            ひとりで抱え込んでいませんか？
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.title}
              className="bg-background rounded-2xl p-6 border border-border/50 hover:border-accent/30 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl mb-3">{p.emoji}</div>
              <h3 className="text-lg font-bold mb-2">{p.title}</h3>
              <p className="text-text-light text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 animate-fade-in-up animation-delay-500">
          <div className="inline-flex items-center gap-2 bg-accent/5 rounded-full px-6 py-3 border border-accent/20">
            <span className="text-accent font-bold">サロンカルテ</span>
            <span className="text-text-light">が、すべて解決します</span>
          </div>
        </div>
      </div>
    </section>
  );
}
