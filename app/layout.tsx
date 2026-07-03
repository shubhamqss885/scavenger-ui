import "../app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import App from "./App";
import HtmlLangSync from "./HtmlLangSync";
import Script from "next/script";
import { ViewTransitions } from "next-view-transitions";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Derive a preconnectable https origin from an env URL (ws:// → http://).
// Returns null if the URL is missing or unparseable so we render nothing.
const toOrigin = (url?: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url.replace(/^ws(s?):\/\//, "http$1://")).origin;
  } catch {
    return null;
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
  const wsOrigin = toOrigin(process.env.NEXT_PUBLIC_WS_BASE_URL);
  // De-dupe so we don't emit the same origin twice (API + WS often share a host).
  const preconnectOrigins = Array.from(
    new Set([apiOrigin, wsOrigin].filter((o): o is string => Boolean(o))),
  );

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scavenger</title>
        <meta name="description" content="Analyze your data" />
        {/* Warm up DNS + TCP + TLS for the API/WS origins so the first
            authenticated request doesn't pay a cold handshake. */}
        {preconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="" />
        ))}
        {preconnectOrigins.map((origin) => (
          <link key={`dns-${origin}`} rel="dns-prefetch" href={origin} />
        ))}
        {/* <!-- Start cookieyes banner --> */}
        <Script
          id="cookieyes-script"
          src="https://cdn-cookieyes.com/client_data/7b9d680f396caa04e23568a2/script.js"
          strategy="afterInteractive"
        ></Script>
        {/* <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        /> */}
        {/* <!-- End cookieyes banner --> */}
      </head>

      <body
        className={cn(
          "box-border bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <HtmlLangSync />
        <ViewTransitions>
          <App>{children}</App>
        </ViewTransitions>
      </body>
    </html>
  );
}
