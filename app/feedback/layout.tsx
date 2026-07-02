import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scavenger: Feedback",
  description: "Your feedback is valuable to us",
};

export default function FeedbackLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
