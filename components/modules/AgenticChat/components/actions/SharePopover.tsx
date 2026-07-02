"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import {
  getSlackStatus,
  getSlackChannels,
  getTeamsStatus,
  getTeamsChannels,
} from "@/lib/services/agenticChatService";
import { IconSlack } from "@/lib/icons/slack";
import { IconTeams } from "@/lib/icons/teams";

/** Strip markdown syntax to plain text. */
const stripMarkdown = (md: string): string => {
  return md
    .replaceAll(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replaceAll(/\*(.+?)\*/g, "$1") // *italic*
    .replaceAll(/__(.+?)__/g, "$1") // __bold__
    .replaceAll(/_(.+?)_/g, "$1") // _italic_
    .replaceAll(/~~(.+?)~~/g, "$1") // ~~strikethrough~~
    .replaceAll(/`(.+?)`/g, "$1") // `code`
    .replaceAll(/^#{1,6}\s+/gm, "") // headings
    .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [links](url)
    .replaceAll(/!\[([^\]]*)\]\([^)]+\)/g, "$1"); // ![images](url)
};

export const SharePopover = ({
  projectId,
  messageText,
  onSlackShare,
}: Readonly<{
  projectId: string;
  messageText: string;
  onSlackShare?: (query: string) => void;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const [open, setOpen] = useState(false);
  const [editedText, setEditedText] = useState(messageText);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [selectedSlackChannel, setSelectedSlackChannel] = useState("");
  const [selectedTeamsChannel, setSelectedTeamsChannel] = useState("");

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // Fetch Slack status + channels lazily when popover opens (cached across all instances)
  const { data: slackData } = useQuery({
    queryKey: ["slackStatus", projectId],
    queryFn: async () => {
      const status = await getSlackStatus();

      if (!status.enabled) return { enabled: false, channels: [] };
      const channels = await getSlackChannels(projectId).catch(() => []);
      return { enabled: true, channels };
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const slackEnabled = slackData?.enabled ?? false;
  const slackChannels = useMemo(
    () => slackData?.channels ?? [],
    [slackData?.channels],
  );

  // Fetch Teams status + channels lazily when popover opens (cached across all instances)
  const { data: teamsData } = useQuery({
    queryKey: ["teamsStatus", projectId],
    queryFn: async () => {
      const status = await getTeamsStatus(projectId);

      if (!status.enabled) return { enabled: false, channels: [] };

      const channels = await getTeamsChannels(projectId).catch(() => []);
      return { enabled: true, channels };
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const teamsEnabled = teamsData?.enabled ?? false;
  const teamsChannels = useMemo(
    () => teamsData?.channels ?? [],
    [teamsData?.channels],
  );

  // Auto-select first channel when data arrives
  useEffect(() => {
    if (slackChannels.length > 0 && !selectedSlackChannel) {
      setSelectedSlackChannel(slackChannels[0].name);
    }
  }, [slackChannels, selectedSlackChannel]);

  useEffect(() => {
    if (teamsChannels.length > 0 && !selectedTeamsChannel) {
      setSelectedTeamsChannel(teamsChannels[0].name);
    }
  }, [teamsChannels, selectedTeamsChannel]);

  // Reset text when popover opens
  useEffect(() => {
    if (open) setEditedText(messageText);
  }, [open, messageText]);

  const plainText = stripMarkdown(editedText);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ text: plainText });
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        navigator.clipboard.writeText(plainText);
        toast.success(t("share.copiedToClipboard"));
      }
    }
    setOpen(false);
  };

  const handleSlackShare = () => {
    if (!onSlackShare || !selectedSlackChannel) return;
    onSlackShare(
      `${t("share.prompts.slack", { channel: selectedSlackChannel })}\n\n${editedText}`,
    );
    setOpen(false);
  };

  const handleTeamsShare = () => {
    if (!onSlackShare || !selectedTeamsChannel) return;
    onSlackShare(
      `${t("share.prompts.teams", { channel: selectedTeamsChannel })}\n\n${editedText}`,
    );
    setOpen(false);
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(t("share.emailSubject"));
    const body = encodeURIComponent(plainText);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setOpen(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(editedText);
    toast.success(t("share.copiedToClipboard"));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={t("share.trigger")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Icon name="Share2" size="xs" className="text-inherit" />
          <Small as="span" className="hidden sm:inline">
            {t("share.trigger")}
          </Small>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] max-w-[calc(100vw-3rem)] p-4"
      >
        <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("share.title")}
        </p>

        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="mb-3 max-h-[200px] min-h-[100px] text-xs"
          placeholder={t("share.editPlaceholder")}
        />

        {/* Slack row */}
        {slackEnabled && onSlackShare && (
          <div className="mb-3 flex items-center gap-2">
            <IconSlack className="h-4 w-4 shrink-0 text-[#4A154B] dark:text-[#E01E5A]" />
            {slackChannels.length > 0 ? (
              <select
                value={selectedSlackChannel}
                onChange={(e) => setSelectedSlackChannel(e.target.value)}
                className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {slackChannels.map((ch) => (
                  <option key={ch.id} value={ch.name}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedSlackChannel}
                onChange={(e) => setSelectedSlackChannel(e.target.value)}
                placeholder={t("share.channelPlaceholder")}
                className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            )}
            <button
              onClick={handleSlackShare}
              disabled={!selectedSlackChannel}
              className="shrink-0 rounded-md border border-[#4A154B]/30 bg-[#4A154B]/5 px-3 py-1.5 text-xs font-medium text-[#4A154B] transition-colors hover:bg-[#4A154B]/10 disabled:opacity-40 dark:border-[#E01E5A]/30 dark:bg-[#E01E5A]/5 dark:text-[#E01E5A] dark:hover:bg-[#E01E5A]/10"
            >
              {t("share.send")}
            </button>
          </div>
        )}

        {/* Teams row */}
        {teamsEnabled && onSlackShare && (
          <div className="mb-3 flex items-center gap-2">
            <IconTeams className="h-4 w-4 shrink-0 text-[#6264A7]" />
            {teamsChannels.length > 0 ? (
              <select
                value={selectedTeamsChannel}
                onChange={(e) => setSelectedTeamsChannel(e.target.value)}
                className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {teamsChannels.map((ch) => (
                  <option key={ch.name} value={ch.name}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedTeamsChannel}
                onChange={(e) => setSelectedTeamsChannel(e.target.value)}
                placeholder={t("share.channelPlaceholder")}
                className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            )}
            <button
              onClick={handleTeamsShare}
              disabled={!selectedTeamsChannel}
              className="shrink-0 rounded-md border border-[#6264A7]/30 bg-[#6264A7]/5 px-3 py-1.5 text-xs font-medium text-[#6264A7] transition-colors hover:bg-[#6264A7]/10 disabled:opacity-40"
            >
              {t("share.send")}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Icon name="Upload" size="xs" />
              {t("share.shareOther")}
            </button>
          )}

          <button
            onClick={shareToEmail}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="Mail" size="xs" />
            {t("share.email")}
          </button>

          <button
            onClick={copyText}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="Copy" size="xs" />
            {t("share.copy")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
