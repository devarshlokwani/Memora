import type { Metadata } from "next";
import Link from "next/link";

import { Clause, LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy notice · Memora",
  description: "What Memora collects while it is a waitlist, and what it does with it.",
};

/**
 * Written for what the site actually does today, which is hold an email address
 * until there is something to tell you. It is deliberately not a policy for the
 * finished product: promising how course material will be handled before that
 * code exists would be writing fiction into a legal document.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="16 September 2026">
      <Clause title="What this covers">
        <p>
          Memora is not open yet. The site you are on is a description of what it will do and a form
          for being told when it opens. This notice covers that, and nothing else. When the
          application itself opens there will be a fuller notice covering the material you upload,
          and you will be asked to read it before you can upload anything.
        </p>
      </Clause>

      <Clause title="What is collected">
        <p>
          One thing: the email address you type into the waitlist form. Alongside it we store which
          part of the page you submitted from and the date you did it, so we can tell which
          explanations are working.
        </p>
        <p>
          There are no analytics, no advertising tags and no third-party trackers on this site. No
          cookie is set for anything on the marketing pages, which is why you have not been asked
          about cookies.
        </p>
      </Clause>

      <Clause title="What it is used for">
        <p>
          To email you once, when Memora opens. If we ever want to send anything else, we will ask
          first.
        </p>
      </Clause>

      <Clause title="Where it is kept">
        <p>
          In a Postgres database hosted by Supabase, with access limited so that the list can be
          added to from this site but not read back from it. Supabase processes the data on our
          behalf as a sub-processor.
        </p>
      </Clause>

      <Clause title="How long it is kept">
        <p>
          Until Memora opens and the launch email has gone out, or until you ask for it to be
          removed, whichever comes first. If the project is abandoned the list is deleted.
        </p>
      </Clause>

      <Clause title="Your rights">
        <p>
          You can ask to see the address we hold for you, to have it corrected, or to have it
          deleted, and we will do it. There is no account to log into and nothing to cancel: one
          email from you is enough.
        </p>
      </Clause>

      <Clause title="Getting in touch">
        <p>
          Write to the address on{" "}
          <Link
            href="https://devarshlokwani.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-4"
          >
            devarshlokwani.com
          </Link>
          . Memora is run by one person, so it will be that person who answers.
        </p>
      </Clause>
    </LegalPage>
  );
}
