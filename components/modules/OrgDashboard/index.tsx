"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useOrgDashboardsContext } from "@/lib/context/OrgDashboardContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import PageHeader from "@/components/blocks/Header";
import { useTranslation } from "@/lib/i18n/client";
import DashboardEmptyState from "./components/DashboardEmptyState";

const OrgDashboardsPage = () => {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { orgDashboards, addOrgDashboard, deleteOrgDashboard, isLoading } =
    useOrgDashboardsContext();
  const { userOrganizationProfile, isFeatureEnabled, FEATURE_FLAGS } =
    useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_ORG_DASHBOARDS);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const orgId = userOrganizationProfile?.current_organization;

    if (!newName.trim() || !orgId) return;

    setIsCreating(true);
    try {
      const created = await addOrgDashboard(newName.trim(), orgId);

      if (created) {
        router.push(`/dashboard/${created.dashboard_id}`);
      }
      setNewName("");
      setIsDialogOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {t("orgDashboard.list.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full flex-col px-4 sm:px-6">
      <PageHeader title={t("orgDashboard.page.title")}>
        {canEdit && (
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Icon name="Plus" size="sm" className="mr-1" />
            {t("orgDashboard.list.newDashboard")}
          </Button>
        )}
      </PageHeader>

      <p className="mb-6 text-xs text-muted-foreground sm:mx-12">
        {t("orgDashboard.page.subtitle")}
      </p>

      {orgDashboards.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <div className="grid gap-3 sm:mx-12">
          {orgDashboards.map((d) => (
            <div
              key={d.dashboard_id}
              className="group flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              onClick={() => router.push(`/dashboard/${d.dashboard_id}`)}
            >
              <div className="flex items-center gap-3">
                <Icon name="LayoutDashboard" size="md" />
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("orgDashboard.widget.count", {
                      count: d.widget_count,
                    })}
                  </p>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOrgDashboard(d.dashboard_id);
                  }}
                >
                  <Icon name="Trash2" size="sm" variant="destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("orgDashboard.list.createDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("orgDashboard.form.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              {t("orgDashboard.actions.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
            >
              {t("orgDashboard.list.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgDashboardsPage;
