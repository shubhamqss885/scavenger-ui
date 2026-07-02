import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

type ECDHEnvelope = {
  v: number;
  keyId: string;
  ephemeralPublicKey: string;
  nonce: string;
  ciphertext: string;
  tag: string;
};

type SSLConfig = {
  mode: string;
  ca_cert?: string | null;
  cert?: string | null;
};

/**
 * Check if the connection_string is an ECDH-encrypted envelope
 */
const isECDHEncrypted = (connectionString: string): boolean => {
  try {
    const parsed = JSON.parse(connectionString) as Partial<ECDHEnvelope>;
    return (
      parsed.v === 1 &&
      typeof parsed.keyId === "string" &&
      typeof parsed.ephemeralPublicKey === "string" &&
      typeof parsed.nonce === "string" &&
      typeof parsed.ciphertext === "string" &&
      typeof parsed.tag === "string"
    );
  } catch {
    return false;
  }
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      connection_string?: string;
      ssl_config?: SSLConfig;
    };

    if (!body.connection_string) {
      return NextResponse.json(
        { error: "connection_string is required" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");

    // Check if connection_string is ECDH-encrypted
    if (isECDHEncrypted(body.connection_string)) {
      const upstream = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/text2sql/validate_db_connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            connection_url_encrypted: body.connection_string,
            ...(body.ssl_config ? { ssl_config: body.ssl_config } : {}),
          }),
        },
      );

      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    // Reject plaintext connection strings - require encryption
    return NextResponse.json(
      { error: "Connection string must be encrypted" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to reach validation service" },
      { status: 500 },
    );
  }
};
