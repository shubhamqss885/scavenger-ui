// app/api/auth/logout/route.ts
import { getSession, handleLogout } from "@auth0/nextjs-auth0";
import type { AppRouteHandlerFnContext } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { getRequestBaseUrl } from "@/lib/utils/getRequestBaseUrl";

const logoutHandler = handleLogout((req) => ({
  returnTo: getRequestBaseUrl(req as NextRequest),
}));

export async function GET(req: NextRequest, ctx: AppRouteHandlerFnContext) {
  const sessionCheckRes = NextResponse.next();
  const session = await getSession(req, sessionCheckRes);

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return await logoutHandler(req, ctx);
}
