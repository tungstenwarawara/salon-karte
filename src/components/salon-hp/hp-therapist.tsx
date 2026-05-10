import Image from "next/image";

type Props = {
  therapist: {
    eyebrow?: string;
    name_en: string; // "Ruika." 等
    role: string;
    description: string;
    image_path: string;
    career?: string;
    license?: string;
    specialty?: string;
  };
};

/** Claude Design: 5fr/7fr グリッド、左に縦長ポートレート、右にテキスト */
export function HpTherapist({ therapist }: Props) {
  return (
    <section className="px-[5vw] py-24 md:py-[120px] max-w-[1180px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-20 items-center">
        <div className="reveal-img" style={{ aspectRatio: "3/4" }}>
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={therapist.image_path}
              alt={therapist.name_en}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.04]"
              style={{ filter: "saturate(0.88)" }}
            />
          </div>
        </div>
        <div>
          <span className="head-en reveal block">{therapist.eyebrow ?? "THERAPIST"}</span>
          <h2
            className="reveal font-serif-en italic font-light mt-6 mb-1 leading-none"
            style={{ fontSize: "clamp(48px, 6vw, 84px)" }}
          >
            {therapist.name_en}
          </h2>
          <span className="reveal block font-sans-en text-[11px] tracking-[0.4em] uppercase text-[color:var(--ink-mute)]">
            {therapist.role}
          </span>
          <p className="reveal text-sm leading-[2.3] text-[color:var(--ink-soft)] my-8 max-w-[520px] whitespace-pre-line">
            {therapist.description}
          </p>
          <dl
            className="reveal mt-8 grid pt-7 border-t border-[color:var(--line)] text-xs"
            style={{ gridTemplateColumns: "100px 1fr", rowGap: "14px", columnGap: "24px" }}
          >
            {therapist.career && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Career
                </dt>
                <dd className="m-0 text-[color:var(--ink)] tracking-[0.12em]">{therapist.career}</dd>
              </>
            )}
            {therapist.license && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  License
                </dt>
                <dd className="m-0 text-[color:var(--ink)] tracking-[0.12em]">{therapist.license}</dd>
              </>
            )}
            {therapist.specialty && (
              <>
                <dt className="font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] uppercase pt-1">
                  Specialty
                </dt>
                <dd className="m-0 text-[color:var(--ink)] tracking-[0.12em]">{therapist.specialty}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
