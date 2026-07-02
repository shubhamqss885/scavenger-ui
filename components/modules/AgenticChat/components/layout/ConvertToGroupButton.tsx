"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useContextSelector } from "use-context-selector";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/client";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useGroups } from "@/lib/context/GroupsContext";
import { convertProjectToGroup } from "@/lib/services/projectService";
import { AgenticChatContext } from "../../AgenticChatContext";

const ConvertToGroupButton = () => {
  const { t } = useTranslation("agentic-chat");
  const router = useRouter();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const { refreshGroups } = useGroups();

  const projectId = useContextSelector(AgenticChatContext, (c) => c!.projectId);
  const orgdbId = useContextSelector(AgenticChatContext, (c) => c!.orgdbId);
  const groupId = useContextSelector(AgenticChatContext, (c) => c!.groupId);
  const projectName = useContextSelector(
    AgenticChatContext,
    (c) => c!.projectName,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const isGroupsEnabled = isFeatureEnabled(FEATURE_FLAGS.VIEW_GROUPS);
  const isGroupChat = Boolean(groupId);

  const handleOpen = useCallback(() => {
    setGroupName(projectName || "");
    setDialogOpen(true);
  }, [projectName]);

  const handleConvert = useCallback(async () => {
    if (!groupName.trim()) return;

    if (!orgdbId) {
      toast.error(t("collaborate.noDatabase"));
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertProjectToGroup({
        project_id: projectId,
        group_name: groupName.trim(),
      });

      if (result.status_code === 200) {
        toast.success(t("collaborate.success"));
        await refreshGroups();
        router.push(`/groups/${result.group.group_id}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("collaborate.error");
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
      setDialogOpen(false);
      setGroupName("");
    }
  }, [projectId, groupName, orgdbId, t, refreshGroups, router]);

  if (isGroupChat || !isGroupsEnabled || !orgdbId) return null;

  return (
    <>
      <div className="absolute right-2 top-2 z-30">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={handleOpen}
        >
          <Icon name="Users" size="xs" variant="foreground" />
          {t("collaborate.button")}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("collaborate.dialogTitle")}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Beta
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("collaborate.dialogDescription")}
          </p>
          <Input
            placeholder={t("collaborate.namePlaceholder")}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConvert()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t("collaborate.cancel")}
            </Button>
            <Button
              onClick={handleConvert}
              disabled={!groupName.trim() || isConverting}
            >
              {isConverting
                ? t("collaborate.converting")
                : t("collaborate.convert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConvertToGroupButton;
