import type { Metadata } from "next";
import Link from "next/link";

import { Clause, LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms · Memora",
  description: "The terms that apply to the Memora site while it is a waitlist.",
};

/**
 * Terms for a site that does one thing. Anything about accounts, payment,
 * uploaded material or acceptable use belongs in the version written when there
 * is an application to apply them to.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="16 September 2026">
      <Clause title="What you are agreeing to">
        <p>
          These terms cover this website while Memora is not yet open: the pages describing what it
          will do, and the form for joining the waitlist. Using the site means accepting them. If
          you do not, the site does nothing you need to opt out of, so simply close it.
        </p>
        <p>
          Separate terms will apply to the application when it opens, and you will be asked to
          accept them then.
        </p>
      </Clause>

      <Clause title="The waitlist">
        <p>
          Joining the waitlist is a request to be told when Memora opens. It is not a purchase, it
          reserves nothing, and it guarantees no particular date, price or feature. We may close the
          waitlist, change what Memora does, or stop building it entirely.
        </p>
        <p>
          Please use an address you are entitled to use. Adding somebody else&apos;s is the one thing
          that will get an entry removed.
        </p>
      </Clause>

      <Clause title="What is described here is not a promise">
        <p>
          The pages on this site describe an application that is being built. Features shown may
          change or never ship, and nothing here should be treated as a commitment or relied on when
          making a decision that costs you something.
        </p>
      </Clause>

      <Clause title="The site itself">
        <p>
          The site is provided as it is, without warranty, and may be unavailable or change without
          notice. To the extent the law allows, we are not liable for any loss arising from using
          it. Nothing here limits liability for anything that cannot lawfully be limited.
        </p>
      </Clause>

      <Clause title="What belongs to whom">
        <p>
          The name, the writing, the drawings and the code of this site belong to its author. You
          are welcome to link to it, quote it and screenshot it. Please do not pass it off as your
          own.
        </p>
      </Clause>

      <Clause title="Changes and contact">
        <p>
          These terms may change as the project does, and the date at the top will change with them.
          Questions go to the address on{" "}
          <Link
            href="https://devarshlokwani.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-4"
          >
            devarshlokwani.com
          </Link>
          .
        </p>
      </Clause>
    </LegalPage>
  );
}
