import { getSession, updateSession, getAccessToken } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);

    if (!session?.user) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Get fresh access token and user data from Auth0
    const { accessToken } = await getAccessToken(req, res);

    const userResponse = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!userResponse.ok) {
      throw new Error(`Auth0 userinfo API error: ${userResponse.status}`);
    }

    const freshUserData = await userResponse.json();

    if (freshUserData.email_verified) {
      await updateSession(req, res, {
        ...session,
        user: {
          ...session.user,
          ...freshUserData,
          // Ensure email_verified is properly updated
          email_verified: freshUserData.email_verified,
        },
      });

      return NextResponse.json(
        {
          success: true,
          email_verified: freshUserData.email_verified,
          message: "Session refreshed successfully",
        },
        res,
      );
    }

    return NextResponse.json({ error: "Email not verified" }, { status: 401 });
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh session",
        details: error?.message,
      },
      { status: 401 },
    );
  }
}
