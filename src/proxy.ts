import { type NextRequest } from "next/server";

import { updateSession } from "@/server/db/proxy";

/** Next 16 calls this Proxy; it is the former middleware.ts. */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
