"use client";

import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "../../AgenticChatContext";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n/client";
import { ProjectFilesList } from "./ProjectFilesList";
import { FileUploadZone } from "./FileUploadZone";

const ProjectFilesPanel = () => {
  const { t } = useTranslation("agentic-chat");

  const projectFiles = useContextSelector(
    AgenticChatContext,
    (c) => c!.projectFiles,
  );
  const isLoadingFiles = useContextSelector(
    AgenticChatContext,
    (c) => c!.isLoadingFiles,
  );
  const isUploadingFile = useContextSelector(
    AgenticChatContext,
    (c) => c!.isUploadingFile,
  );
  const uploadProjectFile = useContextSelector(
    AgenticChatContext,
    (c) => c!.uploadProjectFile,
  );
  const deleteProjectFile = useContextSelector(
    AgenticChatContext,
    (c) => c!.deleteProjectFile,
  );
  const isFilesPanelOpen = useContextSelector(
    AgenticChatContext,
    (c) => c!.isFilesPanelOpen,
  );
  const setFilesPanelOpen = useContextSelector(
    AgenticChatContext,
    (c) => c!.setFilesPanelOpen,
  );

  return (
    <Sheet open={isFilesPanelOpen} onOpenChange={setFilesPanelOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Icon name="FileSpreadsheet" size="md" />
            {t("files.panelTitle")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <FileUploadZone
            onUpload={uploadProjectFile}
            isUploading={isUploadingFile}
          />

          <ProjectFilesList
            files={projectFiles}
            isLoading={isLoadingFiles}
            onDelete={deleteProjectFile}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectFilesPanel;
