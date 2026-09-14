/**
 * Every section opens the same way: a handwritten line, the headline in the
 * reading face at one size, then a sentence of plain prose. Using one component
 * rather than three near-identical headings is what keeps the tabs feeling like
 * pages of the same thing.
 */
export function SectionIntro({
  eyebrow,
  title,
  blurb,
  heading = "h2",
}: {
  eyebrow: string;
  title: React.ReactNode;
  blurb: React.ReactNode;
  /** The landing section owns the page's only h1. */
  heading?: "h1" | "h2";
}) {
  const Title = heading;

  return (
    <div className="text-center">
      <p className="font-hand text-2xl text-ink-soft">{eyebrow}</p>
      <Title className="mx-auto mt-3 max-w-[22ch] text-balance font-reading text-[2.5rem] leading-[1.12] tracking-[-0.015em] text-ink sm:text-[3.4rem]">
        {title}
      </Title>
      <p className="mx-auto mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-ink-soft">
        {blurb}
      </p>
    </div>
  );
}
