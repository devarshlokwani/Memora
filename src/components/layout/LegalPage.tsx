import { DashedRule } from "@/components/ui/DashedRule";

/**
 * The heading block the terms and the privacy notice share.
 *
 * Only the words. The nav, the second row under it carrying these two, and the
 * panel they all sit in belong to the layout the pages share, so that moving
 * between them changes nothing but what is written here.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** The date the wording last changed, which is the first thing anyone checks. */
  updated: string;
  children: React.ReactNode;
}) {
  return (
    // Narrower than the panel. The panel is sized for diagrams and cards; a
    // paragraph set that wide is a paragraph nobody finishes.
    <div className="mx-auto max-w-3xl">
      <p className="font-hand text-2xl text-ink-soft">The small print,</p>
      <h1 className="mt-2 font-reading text-[2.6rem] leading-[1.1] tracking-[-0.015em] text-ink">
        {title}
      </h1>
      <p className="mt-3 text-[0.9rem] text-ink-soft">Last updated {updated}</p>

      <div className="mt-8">
        <DashedRule />
      </div>

      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

/** One numbered clause: a heading somebody can point at, and the text under it. */
export function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-reading text-[1.35rem] leading-snug text-ink">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[0.98rem] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}
