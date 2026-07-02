import { NextRequest, NextResponse } from "next/server";

const extractEmail = (idToken: string | undefined): string => {
  if (!idToken) return "unknown";

  try {
    const payload = idToken.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const info = JSON.parse(atob(padded)) as { email?: string };

    return info.email ?? "unknown";
  } catch {
    return "unknown";
  }
};

const popupHtml = (payload: Record<string, string>): NextResponse => {
  // Use window.location.origin as the postMessage target — never "*".
  // The callback is served from the same origin as the app, so this is exact and safe.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authenticating…</title></head>
<body>
<script>
(function () {
  var p = ${JSON.stringify(payload).replaceAll("<", String.raw`\u003c`)};
  if (window.opener) window.opener.postMessage(p, window.location.origin);
  window.close();
})();
</script>
<p style="font-family:sans-serif;font-size:14px;color:#555;margin:40px auto;
           max-width:400px;text-align:center;">
  Authentication complete. You may close this window.
</p>
</body>
</html>`;

  // The payload contains a Google refresh_token. no-store prevents disk cache,
  // bfcache (per spec, no-store evicts the main document), and any intermediate
  // proxy from retaining the credential. The two extra headers are defense in
  // depth for the same response.
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  // Echo state back so the opener can validate it against the value it generated (CSRF).
  const state = searchParams.get("state") ?? "";

  if (error || !code) {
    return popupHtml({
      type: "google_oauth_error",
      error: error ?? "No authorization code received.",
      state,
    });
  }

  try {
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenResp.ok) {
      const body = await tokenResp.text();
      console.error("[oauth/google/callback] Token exchange failed:", body);
      throw new Error("Token exchange failed. Please try again.");
    }

    const tokens = (await tokenResp.json()) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
    };

    if (!tokens.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Ensure the app requests offline access and the user has not previously authorized it (try revoking at myaccount.google.com/permissions).",
      );
    }

    const email = extractEmail(tokens.id_token);

    // Only the per-user tokens are sent to the browser — client_secret stays server-side.
    // The frontend calls /api/oauth/google/credentials to build the full credentials JSON.
    return popupHtml({
      type: "google_oauth_success",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? "",
      email,
      state,
    });
  } catch (err) {
    return popupHtml({
      type: "google_oauth_error",
      error: err instanceof Error ? err.message : String(err),
      state,
    });
  }
};
