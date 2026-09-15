import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { DashedRule } from "@/components/ui/DashedRule";

/**
 * The shell the terms and the privacy notice sit in.
 *
 * Plain, and outside the landing page's section machinery. Somebody reading
 * these is checking one specific thing, and a page that animates at them while
 * they do it is a page getting in the way.
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
    <div className="flex flex-1 flex-col">
      <header className="relative z-50 bg-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Memora home">
            <Logo />
          </Link>
          <Link href="/" className="text-[0.95rem] text-ink-soft transition-colors hover:text-ink">
            Back to the site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-14">
        <p className="font-hand text-2xl text-ink-soft">The small print,</p>
        <h1 className="mt-2 font-reading text-[2.6rem] leading-[1.1] tracking-[-0.015em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[0.9rem] text-ink-soft">Last updated {updated}</p>

        <div className="mt-8">
          <DashedRule />
        </div>

        <div className="mt-10 space-y-8">{children}</div>
      </main>
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
