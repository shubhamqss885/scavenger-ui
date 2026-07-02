import { getAccessToken } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const res = new NextResponse();
    const { accessToken } = await getAccessToken(req, res);

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
      console.error("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return NextResponse.json(
        { error: "API base URL not configured" },
        { status: 500 },
      );
    }

    const normalizedBase = apiBaseUrl.endsWith("/")
      ? apiBaseUrl.slice(0, -1)
      : apiBaseUrl;

    const upstreamResponse = await fetch(
      `${normalizedBase}/payment/events/clear-notification-events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      console.error("Failed to clear payment notification events:", errorBody);
      return NextResponse.json(
        { error: "Failed to clear payment notification events" },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json({ success: true }, res);
  } catch (error) {
    console.error("Error clearing payment notification events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
