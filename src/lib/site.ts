/**
 * Where this copy of the site lives.
 *
 * Needed by anything that has to produce an absolute URL rather than a path:
 * social previews, the sitemap, the canonical tag. A relative path is fine in
 * an href and useless in an OpenGraph tag, because the thing reading it is a
 * different machine with no idea what host it came from.
 *
 * Resolved in three steps so it is right everywhere without being configured
 * anywhere:
 *
 *   1. NEXT_PUBLIC_SITE_URL, once there is a real domain worth pinning.
 *   2. The production domain Vercel sets by itself. Note this is the project's
 *      stable domain, not VERCEL_URL, which is unique per deployment and would
 *      make every preview advertise itself as the canonical site.
 *   3. Localhost, so `next dev` and `next build` work with nothing set.
 */
function resolve() {
  const pinned = process.env.NEXT_PUBLIC_SITE_URL;
  if (pinned) return pinned.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();

/** The one sentence that describes Memora, used in more than one place. */
export const SITE_DESCRIPTION =
  "Hand over your course material and get back a study structure and cards that drill it. Built for people who have exams on Monday.";

/**
 * When the waitlist page went public, as an ISO 8601 instant.
 *
 * A constant rather than a computed date on purpose: this is the day the page
 * was published, so it must not move every time the site is rebuilt. Change it
 * only if the page is genuinely republished.
 */
export const WAITLIST_OPENED = "2026-09-20T00:00:00.000Z";
