"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PaymentProcessing } from "@/components/modules/PaymentProcessing";
import { useEffect } from "react";

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromStripe = searchParams.get("success") === "true";

  // Guard: Only allow access from Stripe callback
  useEffect(() => {
    if (!fromStripe) {
      router.push("/home");
    }
  }, [fromStripe, router]);

  // Prevent rendering if not from Stripe
  if (!fromStripe) {
    return null;
  }

  return <PaymentProcessing />;
}
