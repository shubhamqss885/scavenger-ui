import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

// Scopes needed across all GCP connectors.
const SCOPES = [
  "https://www.googleapis.com/auth/bigquery.readonly",
  "https://www.googleapis.com/auth/spanner.data",
  "https://www.googleapis.com/auth/datastore",
  "https://spreadsheets.google.com/feeds",
  "https://www.googleapis.com/auth/drive.readonly",
  "openid",
  "email",
].join(" ");

export const GET = async (request: NextRequest) => {
  const res = new NextResponse();
  const session = await getSession(request, res);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = request.nextUrl.searchParams.get("state") ?? "";

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
    include_granted_scopes: "true",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/auth?${params}`,
  );
};
