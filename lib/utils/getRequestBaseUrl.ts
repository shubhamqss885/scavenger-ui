import { NextRequest } from "next/server";

const getRequestBaseUrl = (req: NextRequest): string => {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  if (!host) {
    const fallback = process.env.AUTH0_BASE_URL;

    if (!fallback) {
      throw new Error(
        "getRequestBaseUrl: request has no host header and AUTH0_BASE_URL is unset",
      );
    }
    return fallback;
  }

  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
};

export { getRequestBaseUrl };
