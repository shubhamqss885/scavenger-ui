"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountSettingsForm } from "./components/AccountSettingsForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n/client";

// activeTab / onTabChange are accepted but unused — the modal no longer
// renders tabs. Kept on the props so callers don't have to change. Might be
// reinstated when paywall is re-enabled.
type SettingsModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}>;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation("settings");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-full max-w-[calc(100vw-2rem)] flex-col rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("modal.title")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] overflow-y-auto px-2">
          <div className="py-4">
            <AccountSettingsForm />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
