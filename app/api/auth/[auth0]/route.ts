import {
  handleAuth,
  handleCallback,
  handleLogin,
  AfterCallbackAppRoute,
} from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { getRequestBaseUrl } from "@/lib/utils/getRequestBaseUrl";

const afterCallback: AfterCallbackAppRoute = async (
  req: NextRequest, // Dont remove this
  session: any,
) => {
  return session;
};

export const GET = handleAuth({
  login: handleLogin((req) => {
    const baseUrl = getRequestBaseUrl(req as NextRequest);
    return {
      returnTo: baseUrl,
      authorizationParams: {
        redirect_uri: `${baseUrl}/api/auth/callback`,
      },
    };
  }),
  callback: handleCallback((req) => {
    const baseUrl = getRequestBaseUrl(req as NextRequest);
    return {
      redirectUri: `${baseUrl}/api/auth/callback`,
      afterCallback,
    };
  }),
  onError(req: NextRequest) {
    const url = req.nextUrl.clone();
    url.pathname = "/error";
    return NextResponse.redirect(url);
  },
});
