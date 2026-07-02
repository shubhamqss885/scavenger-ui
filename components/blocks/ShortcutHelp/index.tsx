"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { H3, Small } from "@/components/ui/typography";
import {
  SHORTCUTS,
  getShortcutDescription,
  getShortcutCategories,
  ShortcutKey,
} from "@/lib/shortcuts";
import { getOSName } from "@/lib/utils";
import KeyboardShortcut from "@/components/blocks/KeyboardShortcut";
import { useTranslation } from "@/lib/i18n/client";

interface ShortcutHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutHelp = ({ open, onOpenChange }: ShortcutHelpProps) => {
  const { t } = useTranslation("common");
  const osName = getOSName();
  const showDualColumns = osName === "unknown";

  const renderShortcutRow = (shortcutKey: ShortcutKey) => {
    const shortcut = SHORTCUTS[shortcutKey];
    const description = getShortcutDescription(shortcutKey, t);

    if (showDualColumns) {
      return (
        <div
          key={shortcutKey}
          className="grid grid-cols-3 gap-4 items-center py-1.5"
        >
          <Small className="text-slate-600 text-left">{description}</Small>
          <div className="w-[250px] flex justify-center">
            <KeyboardShortcut shortcut={shortcut} forMac={false} />
          </div>
          <div className="w-[250px] flex justify-center">
            <KeyboardShortcut shortcut={shortcut} forMac={true} />
          </div>
        </div>
      );
    } else {
      return (
        <div
          key={shortcutKey}
          className="flex items-center justify-between py-1.5"
        >
          <Small className="text-slate-600">{description}</Small>
          <KeyboardShortcut shortcut={shortcut} forMac={osName === "mac"} />
        </div>
      );
    }
  };

  const renderCategory = (categoryKey: string) => {
    const categories = getShortcutCategories(t);
    const category = categories[categoryKey as keyof typeof categories];

    return (
      <div key={categoryKey} className="mb-3">
        <H3 className="mb-1 text-sm font-semibold text-slate-800">
          {category.title}
        </H3>
        <div>
          {category.shortcuts.map((shortcutKey) =>
            renderShortcutRow(shortcutKey),
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[675px] max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>
        {showDualColumns && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-slate-600"></div>
            <div className="w-[250px] text-sm font-medium text-slate-600 text-center">
              Windows/Linux
            </div>
            <div className="w-[250px] text-sm font-medium text-slate-600 text-center">
              macOS
            </div>
          </div>
        )}

        <div className="">
          {Object.keys(getShortcutCategories(t)).map(renderCategory)}

          <div className="mt-3 pt-2 border-t">
            <Small className="text-slate-500">
              Press{" "}
              <KeyboardShortcut
                shortcut="alt+shift+slash"
                forMac={osName === "mac"}
                className="inline-flex"
              />{" "}
              to open this dialog
            </Small>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelp;
