import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scavenger: Data Sources",
  description: "Manage and analyze your data sources",
};

export default function DataSourcesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
