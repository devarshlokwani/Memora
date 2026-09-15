"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { PushButton } from "@/components/ui/PushButton";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * The call to action, which asks for nothing until it is pressed.
 *
 * A field sitting on the page before anyone has said they want anything is a
 * form to be ignored. A button is an offer, and the field only arrives once it
 * has been taken up, by which point filling it in is the obvious next thing to
 * do rather than an interruption.
 */
export function WaitlistCta({
  source,
  label = "Build my first course",
  align = "center",
}: {
  source: string;
  label?: string;
  align?: "center" | "left";
}) {
  const [asked, setAsked] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (!asked || !form) return;

    if (!prefersReducedMotion()) {
      gsap.fromTo(form, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE });
    }
    /* Straight into the field: pressing the button was the decision, and being
       made to click a second time to start typing undoes it. Asked for by type,
       because the first input in the form is the hidden one carrying where the
       address came from, and nothing can be focused on that. */
    form.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true });
  }, [asked]);

  if (!asked) {
    return (
      <PushButton onPress={() => setAsked(true)}>
        {label}
      </PushButton>
    );
  }

  return (
    <div ref={formRef}>
      <WaitlistForm source={source} align={align} />
    </div>
  );
}
