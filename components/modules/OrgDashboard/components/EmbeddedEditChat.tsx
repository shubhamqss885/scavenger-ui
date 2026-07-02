"use client";

import { AgenticChatProvider } from "@/components/modules/AgenticChat/AgenticChatContext";
import AgenticChatLayout from "@/components/modules/AgenticChat/components/layout/AgenticChatLayout";
import type { WidgetEditContext } from "@/components/modules/AgenticChat/types";
import { useTranslation } from "@/lib/i18n/client";

type EmbeddedEditChatProps = Readonly<{
  projectId: string;
  edit: WidgetEditContext;
}>;

// Thin wrapper so the heavy AgenticChat module is lazy-loaded by EditWidgetSheet.
const EmbeddedEditChat = ({ projectId, edit }: EmbeddedEditChatProps) => {
  const { t } = useTranslation("dashboard");
  return (
    <AgenticChatProvider projectId={projectId} edit={edit}>
      <AgenticChatLayout
        embedded
        emptyHint={t("orgDashboard.widget.editStartHint")}
      />
    </AgenticChatProvider>
  );
};

export default EmbeddedEditChat;
