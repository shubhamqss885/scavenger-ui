import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the Google Picker API config to authenticated users only.
 * Keeps keys out of the client-side JS bundle (no NEXT_PUBLIC_ exposure).
 */
export const GET = async (req: NextRequest) => {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const developerKey = process.env.GOOGLE_DEVELOPER_KEY;

  if (!clientId || !developerKey) {
    return NextResponse.json(
      { error: "Google Picker is not configured" },
      { status: 500 },
    );
  }

  // App ID is the project number — the numeric prefix of the OAuth client ID.
  const appId = clientId.split("-")[0] ?? "";

  return NextResponse.json(
    { clientId, appId, developerKey },
    { headers: { "Cache-Control": "no-store" } },
  );
};
