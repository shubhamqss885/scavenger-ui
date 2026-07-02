"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShortcut } from "@/hooks/useShortcut";
import ShortcutHelp from "@/components/blocks/ShortcutHelp";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";

export function GlobalShortcuts() {
  const router = useRouter();
  const { enforceLimit } = useDashboardStats();

  const [isGlobalShortcutHelpOpen, setIsGlobalShortcutHelpOpen] =
    useState(false);

  useShortcut("SHOW_SHORTCUTS_HELP", () => setIsGlobalShortcutHelpOpen(true));

  useShortcut("NEW_PROJECT", () => {
    if (enforceLimit("project")) return;
    router.push("/home");
  });

  return (
    <ShortcutHelp
      open={isGlobalShortcutHelpOpen}
      onOpenChange={setIsGlobalShortcutHelpOpen}
    />
  );
}
