import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { PageShell } from "@/components/layout/PageShell";
import { Marked } from "@/components/ui/Marked";

export const metadata: Metadata = {
  title: "Join the waitlist · Memora",
  description: "Be told the day Memora opens. One email, nothing else.",
};

/**
 * The waitlist on a page of its own.
 *
 * Everything that offers the waitlist from somewhere it cannot be shown in place
 * comes here: the nav, the footer, anything linked from outside. A route always
 * works, where an anchor only works if the right section happens to be on screen.
 *
 * It wears the same nav as the landing page, with the gap in the panel cut under
 * the waitlist, so arriving here reads as moving along the row rather than as
 * leaving the site.
 */
export default function WaitlistPage() {
  return (
    <PageShell activeId="waitlist">
      <div className="mx-auto max-w-xl py-6 text-center">
        <p className="font-hand text-2xl text-ink-soft">Not open yet,</p>
        <h1 className="mt-3 font-reading text-[2.8rem] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[3.4rem]">
          Be there the <Marked>day it opens</Marked>
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Memora is being built. Leave an address and you will hear once, on the day you can hand
          over a PDF and get a course back.
        </p>

        <div className="mt-9">
          <WaitlistForm source="waitlist-page" />
        </div>

        <p className="mt-10 text-[0.9rem] text-ink-soft">
          <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
            Terms
          </Link>
          <span className="px-2 text-rule">·</span>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
