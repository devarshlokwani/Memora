"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/server/db/client";

/**
 * Joining the waitlist.
 *
 * The one thing on the site anyone can do before there is an app behind it, so
 * it has to work on its own: no account, no session, nothing to configure on the
 * visitor's side.
 */

export type WaitlistState =
  | { status: "idle" }
  | { status: "joined"; already: boolean }
  | { status: "error"; message: string };

/** Postgres for "that unique index already has this row in it". */
const DUPLICATE = "23505";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(
  _previous: WaitlistState,
  form: FormData,
): Promise<WaitlistState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const source = String(form.get("source") ?? "") || null;

  if (!email) return { status: "error", message: "An email address, and you are on the list." };
  if (email.length > 254 || !EMAIL.test(email)) {
    return { status: "error", message: "That does not look like an email address." };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "The waitlist is not connected yet. Try again shortly.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ email, source });

  if (error) {
    // Already on the list is a success as far as anyone signing up is concerned.
    if (error.code === DUPLICATE) return { status: "joined", already: true };
    return { status: "error", message: "Something went wrong saving that. Try again?" };
  }

  return { status: "joined", already: false };
}
