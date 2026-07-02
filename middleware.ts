import {
  withMiddlewareAuthRequired,
  getSession,
  getAccessToken,
  touchSession,
} from "@auth0/nextjs-auth0/edge";
import { NextRequest, NextResponse } from "next/server";

const INTERNAL_DOMAIN = "@scavenger-ai.com";

// Maintenance mode check wrapper
function maintenanceCheck(req: NextRequest, userEmail: string) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const { pathname } = req.nextUrl;

  // If maintenance mode is enabled and not on maintenance page
  if (isMaintenanceMode && pathname !== "/maintenance") {
    // Internal users bypass maintenance mode
    if (!userEmail.endsWith(INTERNAL_DOMAIN)) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // If maintenance mode is disabled and on maintenance page, redirect to home
  if (!isMaintenanceMode && pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return null; // Continue with normal flow
}

export default withMiddlewareAuthRequired(async function middleware(req) {
  const res = NextResponse.next();
  const session: any = await getSession(req, res);

  if (!session) {
    res.headers.set("x-logout", "true");
    return res;
  }

  const maintenanceResponse = maintenanceCheck(req, session.user?.email ?? "");

  if (maintenanceResponse) return maintenanceResponse;

  try {
    await touchSession(req, res);
    const { accessToken } = await getAccessToken(req, res);

    if (!accessToken) {
      res.headers.set("x-logout", "true");
      return res;
    }

    res.headers.set("x-logout", "false");
    return res;
  } catch {
    res.headers.set("x-logout", "true");
    return res;
  }
});

export const config = {
  matcher: ["/((?!error|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
