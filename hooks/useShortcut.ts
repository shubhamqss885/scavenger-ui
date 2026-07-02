import { useHotkeys } from "react-hotkeys-hook";
import { SHORTCUTS, ShortcutKey } from "@/lib/shortcuts";

export const useShortcut = (
  shortcutKey: ShortcutKey,
  handler: () => void,
  options?: Parameters<typeof useHotkeys>[2],
) => {
  const shortcutString = SHORTCUTS[shortcutKey];

  useHotkeys(shortcutString, handler, {
    preventDefault: true,
    enableOnFormTags: true,
    ...options,
  });
};
