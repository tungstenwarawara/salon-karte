/**
 * テスターオーナーの実話 — Q&A形式・編集ゼロ・改善要望も開示。
 * 改行: text-balance/text-pretty + [word-break:auto-phrase] で日本語の不自然な切れ目を抑制。
 */

import Image from "next/image";
import { ScrollFadeIn } from "./scroll-fade-in";
import { PROFILE, HERO_QA, SUB_QAS, FEEDBACK_REQUESTS } from "./testimonial-data";

const WRAP = "text-pretty [word-break:auto-phrase]";

export function TestimonialSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F1ED] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-10 md:mb-14">
            <p className="text-xs md:text-sm font-medium text-accent mb-3 tracking-[0.2em]">
              UNEDITED VOICE
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-balance [word-break:auto-phrase]`}>
              使っているオーナーさんの、編集なしの本音
            </h2>
            <p className={`text-text-light text-base md:text-lg leading-relaxed ${WRAP}`}>
              インタビューでいただいた回答を、誤字以外そのまま掲載しています。
              <br className="hidden md:inline" />
              良かった声も、改善要望も、隠さず載せます。
            </p>
          </div>
        </ScrollFadeIn>

        {/* メインカード: プロフィール + Q&A */}
        <ScrollFadeIn delay={100}>
          <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 mb-8">
            <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
              <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[460px] bg-background">
                <Image
                  src="/testimonials/sei-portrait.jpg"
                  alt={`${PROFILE.title} ${PROFILE.name}のポートレート`}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                <div className="mb-6 pb-5 border-b border-border/60">
                  <p className="text-xl font-bold leading-tight">{PROFILE.name}</p>
                  <p className="text-sm text-text-light mt-1.5">{PROFILE.business}</p>
                  <p className="text-xs font-medium text-accent mt-1.5">{PROFILE.metric}</p>
                </div>
                <p className="text-xs font-semibold text-accent mb-2 tracking-wider">Q.</p>
                <p className={`text-sm md:text-base font-medium text-text mb-5 leading-relaxed ${WRAP}`}>
                  {HERO_QA.question}
                </p>
                <p className="text-xs font-semibold text-text-light mb-2 tracking-wider">A.</p>
                <blockquote className={`text-base md:text-lg leading-relaxed text-text ${WRAP}`}>
                  {HERO_QA.answer}
                </blockquote>
              </div>
            </div>
          </article>
        </ScrollFadeIn>

        {/* 使用シーン2枚 */}
        <ScrollFadeIn delay={150}>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
            {[
              { src: "/testimonials/sei-using-app.jpg", alt: "サロンの店内で salon-karte の予約画面を確認している様子", caption: "施術の合間に予約をひと目で確認" },
              { src: "/testimonials/sei-tablet.jpg", alt: "紙のノートに代わって salon-karte をタブレットで使う様子", caption: "紙のカルテを置き換えて、タブレットで一元管理" },
            ].map((p) => (
              <figure key={p.src} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-background">
                <Image src={p.src} alt={p.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 md:p-5">
                  <p className="text-white text-sm md:text-base font-medium">{p.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </ScrollFadeIn>

        {/* サブ Q&A 3つ */}
        <ScrollFadeIn delay={200}>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10">
            {SUB_QAS.map((qa) => (
              <article key={qa.label} className="bg-white rounded-2xl border border-border/50 p-6 flex flex-col">
                <p className="text-[10px] font-bold text-accent mb-3 tracking-[0.2em]">{qa.label}</p>
                <p className="text-xs font-semibold text-accent mb-1.5">Q.</p>
                <p className={`text-sm font-medium text-text mb-4 leading-relaxed ${WRAP}`}>{qa.question}</p>
                <p className="text-xs font-semibold text-text-light mb-1.5">A.</p>
                <blockquote className={`text-sm leading-relaxed text-text-light flex-1 ${WRAP}`}>{qa.answer}</blockquote>
              </article>
            ))}
          </div>
        </ScrollFadeIn>

        {/* 改善要望セクション(誠実さ) */}
        <ScrollFadeIn delay={250}>
          <div className="bg-white rounded-2xl border border-border/50 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-text-light tracking-[0.2em]">HONEST</span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <h3 className={`text-lg md:text-xl font-bold mb-3 text-balance [word-break:auto-phrase]`}>
              実際に Sei 様からいただいている改善要望
            </h3>
            <p className={`text-sm text-text-light mb-5 leading-relaxed ${WRAP}`}>
              salon-karte は完璧ではありません。良いところだけでなく、テスターからいただいた改善要望もそのまま掲載します。
            </p>
            <ul className="space-y-2.5">
              {FEEDBACK_REQUESTS.map((req) => (
                <li key={req} className={`flex gap-3 text-sm text-text leading-relaxed ${WRAP}`}>
                  <span aria-hidden className="text-accent font-bold flex-shrink-0 mt-0.5">→</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            <p className={`text-xs text-text-light mt-5 leading-relaxed ${WRAP}`}>
              いただいた要望は記録し、優先度をつけて順次対応していきます。
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay={300}>
          <p className={`text-center text-xs text-text-light leading-relaxed ${WRAP}`}>
            掲載は本人の許可を得ています。誤字以外の編集は行っていません。
          </p>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
