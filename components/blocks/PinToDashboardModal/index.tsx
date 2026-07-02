"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useOrgDashboardsContext } from "@/lib/context/OrgDashboardContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import type { AddWidgetPayload } from "@/lib/services/orgDashboardService";
import { useTranslation } from "@/lib/i18n/client";

type PinToDashboardModalProps = Readonly<{
  widgetType: "chart" | "table";
  title: string;
  sqlQuery: string;
  // Opaque payload forwarded to the backend. The FE doesn't introspect it on
  // write; the BE persists it and returns it on read (typed there as a dict).
  cachedResult: unknown;
  orgdbId: string;
  trigger?: React.ReactNode;
}>;

const PinToDashboardModal = ({
  widgetType,
  title,
  sqlQuery,
  cachedResult,
  orgdbId,
  trigger,
}: PinToDashboardModalProps) => {
  const { t } = useTranslation("dashboard");
  const { orgDashboards, addOrgDashboard, pinToDashboard } =
    useOrgDashboardsContext();
  const { userOrganizationProfile, isFeatureEnabled, FEATURE_FLAGS } =
    useOrgFeatures();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const orgId = userOrganizationProfile?.current_organization;

  if (!isFeatureEnabled(FEATURE_FLAGS.EDIT_ORG_DASHBOARDS)) return null;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setCreating(false);
      setNewName("");
      setSaving(false);
    }
  };

  const handlePinToExisting = async (dashboardId: string) => {
    setSaving(true);
    const payload: AddWidgetPayload = {
      orgdb_id: orgdbId,
      widget_type: widgetType,
      title,
      sql_query: sqlQuery,
      cached_result: cachedResult,
    };
    await pinToDashboard(dashboardId, payload);
    handleOpenChange(false);
  };

  const handleCreateAndPin = async () => {
    if (!newName.trim() || !orgId) return;
    setSaving(true);

    const created = await addOrgDashboard(newName.trim(), orgId);

    if (created) {
      const payload: AddWidgetPayload = {
        orgdb_id: orgdbId,
        widget_type: widgetType,
        title,
        sql_query: sqlQuery,
        cached_result: cachedResult,
      };
      await pinToDashboard(created.dashboard_id, payload);
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Icon name="Pin" size="xxs" />
            {t("orgDashboard.pin.trigger")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("orgDashboard.pin.dialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[300px] space-y-2 overflow-auto">
          {orgDashboards.map((d) => (
            <button
              key={d.dashboard_id}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
              onClick={() => handlePinToExisting(d.dashboard_id)}
              disabled={saving}
            >
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground">
                {t("orgDashboard.widget.count", { count: d.widget_count })}
              </span>
            </button>
          ))}
        </div>

        {creating ? (
          <div className="flex gap-2">
            <Input
              placeholder={t("orgDashboard.pin.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndPin()}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateAndPin}
              disabled={!newName.trim() || saving}
            >
              {t("orgDashboard.pin.createAndPin")}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setCreating(true)}
          >
            <Icon name="Plus" size="sm" className="mr-1" />
            {t("orgDashboard.list.newDashboard")}
          </Button>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            {t("orgDashboard.actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinToDashboardModal;
