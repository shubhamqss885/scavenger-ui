import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const tokenResponse = await fetch(
      `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.AUTH0_PW_CLIENT_ID,
          client_secret: process.env.AUTH0_PW_CLIENT_SECRET,
          audience: `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/`,
          grant_type: "client_credentials",
        }),
      },
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Trigger verification email
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        user_id: session.user.sub,
        client_id: process.env.AUTH0_PW_CLIENT_ID,
      }),
    };

    const response = await fetch(
      `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/jobs/verification-email`,
      requestOptions,
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error sending verification email:", errorData);
      return new NextResponse(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent successfully",
      },
      res,
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 },
    );
  }
}
