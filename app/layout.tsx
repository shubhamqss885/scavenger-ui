import "../app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import App from "./App";
import Script from "next/script";
import { ViewTransitions } from "next-view-transitions";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scavenger</title>
        <meta name="description" content="Analyze your data" />
        {/* <!-- Start cookieyes banner --> */}
        <Script
          id="cookieyes-script"
          src="https://cdn-cookieyes.com/client_data/7b9d680f396caa04e23568a2/script.js"
          strategy="beforeInteractive"
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
        <ViewTransitions>
          <App>{children}</App>
        </ViewTransitions>
      </body>
    </html>
  );
}
