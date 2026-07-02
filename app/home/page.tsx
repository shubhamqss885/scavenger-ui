import Dashboard from "@/components/modules/Dashboard";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

// Server-side auth so non-viewer users get fully-rendered SSR with no client
// auth round-trip. Viewers are redirected to /dashboard one layer up in
// `app/App.tsx` (InitializedApp), which sees `/home` in its `initialPages`
// list and uses `getHomeRoute(userProfile.user_role_name)` to route them.
export default withPageAuthRequired(
  async function Page() {
    return <Dashboard />;
  },
  { returnTo: "/" },
);
