"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/client";

// Where penny-deal seekers go when they confirm they're on the wrong site.
// The ticket (SCAV-4387) didn't specify a destination, so default to a neutral
// web search. Swap this for the real URL once product confirms one.
const PENNY_DEALS_REDIRECT_URL =
  "https://www.google.com/search?q=home+depot+penny+deals";

export const RegionNoticeDialog = () => {
  const { t } = useTranslation("onboarding");
  const [open, setOpen] = useState(true);

  const handleLeave = () => {
    window.location.href = PENNY_DEALS_REDIRECT_URL;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-lg sm:max-w-lg [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("regionNotice.title")}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-5">
            {t("regionNotice.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleLeave}>
            {t("regionNotice.leaveButton")}
          </Button>
          <Button variant="default" onClick={() => setOpen(false)}>
            {t("regionNotice.continueButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
