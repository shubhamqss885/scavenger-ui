import FeedbackPage from "@/components/modules/Feedback";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default withPageAuthRequired(
  async function page() {
    return <FeedbackPage />;
  },
  { returnTo: "/" },
);
