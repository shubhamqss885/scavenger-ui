import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

/**
 * Builds the full GCP authorized_user credentials JSON server-side.
 *
 * The browser holds only the per-user refresh_token (no client_secret).
 * This auth-gated endpoint assembles the complete credential object that the
 * Python backend needs, keeping client_secret out of the browser entirely.
 */
export const POST = async (req: NextRequest) => {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    refresh_token?: unknown;
  } | null;

  const refreshToken = body?.refresh_token;

  if (!refreshToken || typeof refreshToken !== "string") {
    return NextResponse.json(
      { error: "refresh_token is required" },
      { status: 400 },
    );
  }

  const credentialsJson = JSON.stringify({
    type: "authorized_user",
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    token_uri: "https://oauth2.googleapis.com/token",
  });

  return NextResponse.json(
    { credentials_json: credentialsJson },
    { headers: { "Cache-Control": "no-store" } },
  );
};
