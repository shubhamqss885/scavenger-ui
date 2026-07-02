import { getSession, getAccessToken, updateSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

async function checkFreshVerificationStatus(
  req: NextRequest,
  res: NextResponse,
  session: any,
) {
  try {
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

    if (userResponse.ok) {
      const freshUserData = await userResponse.json();

      if (freshUserData.email_verified) {
        // Update session with fresh verification status
        await updateSession(req, res, {
          ...session,
          user: {
            ...session.user,
            ...freshUserData,
            email_verified: freshUserData.email_verified,
          },
        });

        // Return access token since user is actually verified
        return NextResponse.json({ accessToken }, res);
      }
    }
  } catch (error) {
    console.error("Error checking fresh verification status:", error);
  }

  return null; // Indicates verification check failed or user still unverified
}

function classifyTokenError(error: any): NextResponse {
  const message = error?.message || "";
  const code = error?.code || "";

  if (
    message.includes("refresh_token") ||
    message.includes("invalid_grant") ||
    code === "ERR_REFRESH_TOKEN_EXPIRED"
  ) {
    return NextResponse.json({
      logout: true,
      reason: "refresh_expired",
      error: message,
    });
  }

  if (
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("network") ||
    code === "ENOTFOUND"
  ) {
    return NextResponse.json({
      retry: true,
      reason: "network_error",
      error: message,
    });
  }

  return NextResponse.json({
    logout: true,
    reason: "unknown",
    error: message,
  });
}

export async function GET(req: NextRequest) {
  const res = new NextResponse();

  if (req.headers.get("x-logout") === "true") {
    return NextResponse.json({ logout: true });
  }

  const session = await getSession(req, res);

  if (!session?.user) {
    return NextResponse.json({ logout: true });
  }

  if (!session.user.email_verified) {
    const freshCheckResult = await checkFreshVerificationStatus(
      req,
      res,
      session,
    );

    if (freshCheckResult) {
      return freshCheckResult;
    }
    return NextResponse.json({ unverified: true }, res);
  }

  try {
    const { accessToken } = await getAccessToken(req, res);
    return NextResponse.json({ accessToken }, res);
  } catch (error: any) {
    return classifyTokenError(error);
  }
}
