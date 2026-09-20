import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * The four pages that exist for the public while Memora is a waitlist.
 *
 * Deliberately hand-written rather than crawled off the router: the router
 * knows about a dozen application routes as well, and every one of them would
 * be a dead entry pointing at a login redirect. This list grows when there is
 * genuinely something new to read.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/waitlist`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
