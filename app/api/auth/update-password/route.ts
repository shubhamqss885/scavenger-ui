import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

export async function POST() {
  const session = await getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issuer = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const connection = process.env.AUTH0_DB_CONNECTION;

  if (!issuer || !clientId || !connection) {
    console.error(
      "Password reset: missing AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID or AUTH0_DB_CONNECTION",
    );
    return NextResponse.json(
      { error: "Password reset is not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${issuer}/dbconnections/change_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        email: session.user.email,
        connection,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Password reset request failed:", response.status, body);
      return NextResponse.json(
        { error: "Failed to send password reset email" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request errored:", error);
    return NextResponse.json(
      { error: "Failed to send password reset email" },
      { status: 500 },
    );
  }
}
