"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/client";
import { type DashboardViewer } from "@/lib/services/orgDashboardService";
import ShareLinkSection from "./ShareLinkSection";
import ViewersSection from "./ViewersSection";

type ShareDashboardModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  orgId: string;
  viewers: DashboardViewer[];
  onViewersChange: (viewers: DashboardViewer[]) => void;
  // Each section is gated independently — the trigger shows if either is true.
  canShareLink: boolean;
  canManageViewers: boolean;
}>;

const ShareDashboardModal = ({
  isOpen,
  onClose,
  dashboardId,
  orgId,
  viewers,
  onViewersChange,
  canShareLink,
  canManageViewers,
}: ShareDashboardModalProps) => {
  const { t } = useTranslation("dashboard");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("orgDashboard.shareLink.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {canShareLink && <ShareLinkSection dashboardId={dashboardId} />}
          {canShareLink && canManageViewers && <div className="border-t" />}
          {canManageViewers && (
            <ViewersSection
              dashboardId={dashboardId}
              orgId={orgId}
              viewers={viewers}
              onViewersChange={onViewersChange}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDashboardModal;
