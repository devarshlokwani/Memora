import { type NextRequest } from "next/server";

import { updateSession } from "@/server/db/proxy";

/** Next 16 calls this Proxy; it is the former middleware.ts. */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/*
 * What the proxy is allowed to see.
 *
 * Everything not listed here runs through a session check, which for a signed
 * out visitor means a redirect to the login page. That is right for the
 * application and wrong for the files that describe the site to machines.
 *
 * The original list excused assets by file extension, which covered icon.svg
 * and nothing else: `/robots.txt` and `/sitemap.xml` have extensions nobody
 * listed, and Next serves the social card from `/opengraph-image`, which has
 * no extension at all. All three were answering crawlers and link unfurlers
 * with a 307 to `/login`, so the site had no search presence and every shared
 * link would have unfurled blank.
 *
 * Excused by name rather than made public in `PUBLIC_PATHS`, because these
 * want no session logic whatsoever: a crawler fetching robots.txt should not
 * cost a round trip to Supabase. The image route is matched by prefix, since
 * a production build fingerprints it as `/opengraph-image-<hash>`.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|twitter-image|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
