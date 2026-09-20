import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * What a crawler may look at.
 *
 * Only four pages are worth indexing: the landing page, the waitlist, and the
 * two pieces of small print. Everything else is the application, which sits
 * behind a login and would give a crawler nothing but a redirect. Listing them
 * as disallowed saves the crawl budget and keeps a half-rendered login screen
 * out of anyone's search results.
 *
 * This is not a security measure. It is a request, and a well-behaved crawler
 * honours it. What actually keeps those routes private is the proxy.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard",
        "/courses",
        "/study",
        "/review",
        "/login",
        "/signup",
        "/setup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
