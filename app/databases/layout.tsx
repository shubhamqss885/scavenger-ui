import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scavenger: Databases",
  description: "Analyze your Data",
};

export default function DatabasesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
