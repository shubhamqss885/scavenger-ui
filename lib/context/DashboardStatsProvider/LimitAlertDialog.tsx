"use client";

import { AlertDialogWithoutTrigger } from "@/components/blocks/AlertDialog";
import { MAX_CALENDAR_MEETING_LINK } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/client";
import type { LimitType } from "./limitTypes";

type Props = Readonly<{
  openType: LimitType | null;
  onClose: () => void;
}>;

export const LimitAlertDialog = ({ openType, onClose }: Props) => {
  const { t } = useTranslation("limits");

  const handleAction = () => {
    onClose();
    globalThis.window?.open(
      MAX_CALENDAR_MEETING_LINK,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <AlertDialogWithoutTrigger
      isOpen={openType !== null}
      setIsOpen={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={openType ? t(`${openType}.title`) : ""}
      description={openType ? t(`${openType}.description`) : ""}
      cancelText={t("common.cancel")}
      actionText={t("common.action")}
      onCancel={onClose}
      onAction={handleAction}
    />
  );
};
