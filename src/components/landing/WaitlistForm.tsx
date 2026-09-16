"use client";

import { useActionState } from "react";

import { joinWaitlist, type WaitlistState } from "@/server/waitlist";

/**
 * The only thing on the site anyone can do yet.
 *
 * One field and one button, on a drawn line rather than in a box, so it reads as
 * something written on the page rather than a form bolted to it. The answer
 * replaces the form in place: there is nothing else to do afterwards, and
 * leaving an empty field sitting under a confirmation invites a second go.
 */

const START: WaitlistState = { status: "idle" };

export function WaitlistForm({
  source,
  align = "center",
}: {
  /** Which part of the page this one sits in, recorded with the address. */
  source: string;
  align?: "center" | "left";
}) {
  const [state, submit, pending] = useActionState(joinWaitlist, START);
  const centred = align === "center";

  if (state.status === "joined") {
    return (
      <div className={centred ? "text-center" : "text-left"}>
        <p className="font-reading text-[1.4rem] leading-snug text-ink">
          {state.already ? "You are already on the list." : "You are on the list."}
        </p>
        <p className="mt-1.5 font-hand text-lg text-ink-faint">
          We will write the day it opens. Nothing else, ever.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className={centred ? "mx-auto max-w-md" : "max-w-md"}>
      <input type="hidden" name="source" value={source} />

      <div className="flex items-center gap-3 border-b-[1.5px] border-ink pb-2">
        <label htmlFor={`waitlist-${source}`} className="sr-only">
          Your email address
        </label>
        <input
          id={`waitlist-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          /* An instruction rather than an example. A specimen address reads
             as a format to match, and this one read as a requirement: it is a
             university domain, which is exactly what most of these people are
             not sure they count as having. */
          placeholder="Enter your email here"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent text-[1rem] text-ink outline-none placeholder:text-ink-soft/55 disabled:opacity-60"
        />
        {/* An edge that arrives as you come to it. Sitting bare on the line
            this read as the end of the sentence rather than the thing to
            press; drawn round, it is plainly a button, and it keeps out of the
            way until the pointer is near. The border is there at rest and
            merely transparent, so nothing shifts sideways when it appears. */}
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full border-[1.5px] border-transparent px-3.5 py-1 font-reading text-[1.05rem] text-ink transition-[transform,border-color,background-color,color] duration-150 ease-out hover:-translate-y-px hover:border-ink hover:bg-ink hover:text-paper focus-visible:border-ink disabled:opacity-60"
        >
          {pending ? "One moment" : "Join the waitlist"}
        </button>
      </div>

      <p
        aria-live="polite"
        className={`mt-2.5 font-hand text-lg ${
          state.status === "error" ? "text-accent" : "text-ink-faint"
        }`}
      >
        {state.status === "error"
          ? state.message
          : "No account needed. One email when it opens."}
      </p>
    </form>
  );
}
