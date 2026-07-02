import type { UserData } from "@/lib/services/userService";

// Single source of truth for "where does this user call home".
// org-viewer's only meaningful surface is /dashboard; everyone else lands on /home.
// Used both inside OrgFeatureContext (to expose `homeRoute` to consumers) and in
// App.tsx (which routes initial pages *before* OrgFeatureProvider mounts).
export const getHomeRoute = (
  userRole: UserData["user_role_name"] | undefined,
): string => (userRole === "org-viewer" ? "/dashboard" : "/home");
