"use client";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import AgenticChatLayout from "@/components/modules/AgenticChat/components/layout/AgenticChatLayout";
import { AgenticChatProvider } from "@/components/modules/AgenticChat/AgenticChatContext";
import RotatingStatus from "@/components/modules/AgenticChat/components/messages/RotatingStatus";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useGroups } from "@/lib/context/GroupsContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { GroupHeader } from "./GroupHeader";

type GroupPageProps = Readonly<{
  params: { groupId: string };
}>;

const GroupPage = ({ params }: GroupPageProps) => {
  const { isLoading: isUserLoading } = useUserContext();
  const { groups, isLoading: isGroupsLoading } = useGroups();
  const {
    isFeatureEnabled,
    FEATURE_FLAGS,
    homeRoute,
    isLoading: isFeaturesLoading,
  } = useOrgFeatures();
  const router = useRouter();

  const group = useMemo(
    () => groups.find((g) => g.group_id === params.groupId),
    [groups, params.groupId],
  );

  const canViewGroups = isFeatureEnabled(FEATURE_FLAGS.VIEW_GROUPS);
  const isLoading = isUserLoading || isGroupsLoading || isFeaturesLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!canViewGroups) {
      router.replace(homeRoute);
      return;
    }
    if (!group) {
      router.replace(homeRoute);
    }
  }, [isLoading, canViewGroups, group, router, homeRoute]);

  if (isLoading || !canViewGroups || !group) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <RotatingStatus active />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <GroupHeader groupId={params.groupId} />
      <div className="flex-1 overflow-hidden">
        <AgenticChatProvider
          projectId={group.project_id}
          forceAgno
          groupId={params.groupId}
          groupOrgdbId={group.orgdb_id}
          groupName={group.group_name}
        >
          <AgenticChatLayout />
        </AgenticChatProvider>
      </div>
    </div>
  );
};

export default withPageAuthRequired(GroupPage);
