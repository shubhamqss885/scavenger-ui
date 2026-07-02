/**
 * Centralized keyboard shortcuts configuration
 *
 * This file contains all keyboard shortcuts used throughout the application.
 * To add a new shortcut:
 * 1. Add it to the SHORTCUTS object below
 * 2. Use the useShortcut hook in your component
 *
 * Shortcut format uses react-hotkeys-hook syntax:
 * - mod+key (Cmd on Mac, Ctrl on Windows/Linux)
 * - shift+key, alt+key, etc.
 * - Multiple keys: mod+shift+key
 */

export const SHORTCUTS = {
  REFRESH_PROMPTS: "alt+r",
  TOGGLE_SIDEBAR: "mod+b",
  SWITCH_TO_DASHBOARD: "alt+b",
  NEW_PROJECT: "alt+n",
  PIN_LAST_MESSAGE: "alt+p",
  REFRESH_LAST_MESSAGE: "alt+shift+r",
  COPY_LAST_MESSAGE: "alt+c",
  THUMBS_UP_LAST_MESSAGE: "alt+shift+u",
  THUMBS_DOWN_LAST_MESSAGE: "alt+shift+d",
  COPY_CHART_LAST_MESSAGE: "alt+shift+c",
  DOWNLOAD_TABLE_LAST_MESSAGE: "alt+shift+t",
  REFRESH_TEXT2SQL_LAST_MESSAGE: "alt+shift+f",
  SWITCH_TEXT2SQL_TABS: "alt+t",
  SUMMARIZE_PROJECT_HISTORY: "alt+s",
  SHOW_SHORTCUTS_HELP: "alt+shift+slash",
} as const;

export type ShortcutKey = keyof typeof SHORTCUTS;

// Translation function type
type TranslationFunction = (key: string) => string;

export const getShortcutDescription = (
  key: ShortcutKey,
  t: TranslationFunction,
): string => {
  return t(`shortcuts.descriptions.${key}`);
};

export const getShortcutCategories = (t: TranslationFunction) => ({
  general: {
    title: t("shortcuts.categories.general"),
    shortcuts: [
      "NEW_PROJECT",
      "TOGGLE_SIDEBAR",
      "SWITCH_TO_DASHBOARD",
      "REFRESH_PROMPTS",
      "SUMMARIZE_PROJECT_HISTORY",
      "SHOW_SHORTCUTS_HELP",
    ] as const,
  },
  messages: {
    title: t("shortcuts.categories.messages"),
    shortcuts: [
      "PIN_LAST_MESSAGE",
      "COPY_LAST_MESSAGE",
      "THUMBS_UP_LAST_MESSAGE",
      "THUMBS_DOWN_LAST_MESSAGE",
      "REFRESH_LAST_MESSAGE",
    ] as const,
  },
  text2sql: {
    title: t("shortcuts.categories.text2sql"),
    shortcuts: [
      "COPY_CHART_LAST_MESSAGE",
      "DOWNLOAD_TABLE_LAST_MESSAGE",
      "REFRESH_TEXT2SQL_LAST_MESSAGE",
      "SWITCH_TEXT2SQL_TABS",
    ] as const,
  },
});
