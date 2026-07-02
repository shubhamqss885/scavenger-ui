"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import {
  getOrgMembers,
  grantViewerAccess,
  revokeViewerAccess,
  type OrgMember,
  type DashboardViewer,
} from "@/lib/services/orgDashboardService";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";

type ViewersSectionProps = Readonly<{
  dashboardId: string;
  orgId: string;
  viewers: DashboardViewer[];
  onViewersChange: (viewers: DashboardViewer[]) => void;
}>;

const ViewersSection = ({
  dashboardId,
  orgId,
  viewers,
  onViewersChange,
}: ViewersSectionProps) => {
  const { t } = useTranslation("dashboard");
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setLoadingMembers(true);
    try {
      setOrgMembers(await getOrgMembers(orgId));
    } catch {
      toast.error(t("orgDashboard.viewers.loadFailed"));
    } finally {
      setLoadingMembers(false);
    }
  }, [orgId, t]);

  // Load members when the dialog (and this section) mounts.
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const viewerSubs = new Set(viewers.map((v) => v.user_sub));
  const availableMembers = orgMembers.filter(
    (m) => !viewerSubs.has(m.user_sub),
  );

  const handleGrant = async (member: OrgMember) => {
    setAddingUser(member.user_sub);
    try {
      await grantViewerAccess(dashboardId, member.user_sub);
      onViewersChange([
        ...viewers,
        {
          user_sub: member.user_sub,
          granted_by: "",
          created_at: new Date().toISOString(),
        },
      ]);
      toast.success(
        t("orgDashboard.viewers.added", {
          name: member.username || member.email,
        }),
      );
      setDropdownOpen(false);
    } catch {
      toast.error(t("orgDashboard.viewers.addFailed"));
    } finally {
      setAddingUser(null);
    }
  };

  const handleRevoke = async (userSub: string) => {
    setRemovingUser(userSub);
    try {
      await revokeViewerAccess(dashboardId, userSub);
      onViewersChange(viewers.filter((v) => v.user_sub !== userSub));
      toast.success(t("orgDashboard.viewers.removed"));
    } catch {
      toast.error(t("orgDashboard.viewers.removeFailed"));
    } finally {
      setRemovingUser(null);
    }
  };

  const getDisplayName = (userSub: string) => {
    const member = orgMembers.find((m) => m.user_sub === userSub);
    return member?.username || member?.email || userSub;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t("orgDashboard.viewers.section")}
      </p>

      <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Icon name="UserPlus" size="sm" />
            {t("orgDashboard.viewers.add")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("orgDashboard.viewers.searchPlaceholder")}
            />
            <CommandList>
              <CommandEmpty>
                {loadingMembers
                  ? t("orgDashboard.viewers.loading")
                  : t("orgDashboard.viewers.noMembers")}
              </CommandEmpty>
              <CommandGroup>
                {availableMembers.map((member) => (
                  <CommandItem
                    key={member.user_sub}
                    value={`${member.username} ${member.email}`}
                    onSelect={() => handleGrant(member)}
                    disabled={addingUser === member.user_sub}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.username || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                    {addingUser === member.user_sub && (
                      <Icon
                        name="Loader2"
                        size="xxs"
                        className="ml-auto animate-spin"
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {viewers.length === 0
            ? t("orgDashboard.viewers.noViewers")
            : t("orgDashboard.viewers.count", { count: viewers.length })}
        </p>
        <div className="max-h-[240px] space-y-1 overflow-y-auto">
          {viewers.map((viewer) => (
            <div
              key={viewer.user_sub}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="truncate text-sm">
                {getDisplayName(viewer.user_sub)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRevoke(viewer.user_sub)}
                disabled={removingUser === viewer.user_sub}
              >
                {removingUser === viewer.user_sub ? (
                  <Icon name="Loader2" size="xs" className="animate-spin" />
                ) : (
                  <Icon name="Trash2" size="xs" variant="destructive" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewersSection;
