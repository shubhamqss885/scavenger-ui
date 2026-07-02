import OnboardingPage from "@/components/modules/Onboarding";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { headers } from "next/headers";

// Visitors from these countries see the "are you looking for penny deals?" notice.
// Country comes from Vercel's edge geo header (absent in local dev → notice hidden).
const NORTH_AMERICA_COUNTRIES = ["US", "CA"];

export default withPageAuthRequired(
  async function page() {
    const country = headers().get("x-vercel-ip-country")?.toUpperCase();
    const isNorthAmerica =
      !!country && NORTH_AMERICA_COUNTRIES.includes(country);

    return <OnboardingPage isNorthAmerica={isNorthAmerica} />;
  },
  { returnTo: "/" },
);
