import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

type UploadSSLBody = {
  cert: string;
  filename: string;
  cert_type: "ca" | "client-cert" | "client-key";
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<UploadSSLBody>;

    if (!body.cert || !body.filename) {
      return NextResponse.json(
        { error: "cert and filename are required" },
        { status: 400 },
      );
    }
    if (
      !body.cert_type ||
      !["ca", "client-cert", "client-key"].includes(body.cert_type)
    ) {
      return NextResponse.json(
        { error: "cert_type must be one of: ca, client-cert, client-key" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");

    const upstream = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/agentic/upload-ssl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          cert: body.cert,
          filename: body.filename,
          cert_type: body.cert_type,
        }),
      },
    );

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach certificate upload service" },
      { status: 500 },
    );
  }
};
