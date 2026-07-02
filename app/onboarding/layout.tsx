import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scavenger: Onboarding",
  description: "Analyze your Data",
};

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
