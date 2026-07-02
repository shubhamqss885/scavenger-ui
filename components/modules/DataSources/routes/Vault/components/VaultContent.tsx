"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VaultLoadingSkeleton } from "./VaultLoadingSkeleton";
import { DeleteConfirmationAlert } from "@/components/modules/DataSources/components/DeleteConfirmationAlert";
import { DataSourceRulesModule } from "@/components/modules/DataSources/routes/Rules";
import { DataSourceExamplesModule } from "@/components/modules/DataSources/routes/Examples";
import { useTranslation } from "@/lib/i18n/client";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useVault, type FileActions } from "../context/VaultContext";
import { VaultSidebar } from "./VaultSidebar";
import { VaultPreview } from "./VaultPreview";
import { VaultIntro, type ExampleType } from "./VaultIntro";
import { VaultCreateForm, VaultEditForm } from "./VaultEditor";
import { VaultAudit } from "./VaultAudit";
import { VaultExampleModal } from "./VaultExampleModal";

export type { FileActions };

type Props = Readonly<{
  onFileActions?: (actions: FileActions | null) => void;
}>;

export const VaultContent = ({ onFileActions }: Props) => {
  const { t } = useTranslation("database");
  const [exampleModal, setExampleModal] = useState<ExampleType | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    status,
    loading,
    selectedFile,
    editingFile,
    draft,
    showAudit,
    deleteDialogOpen,
    setDeleteDialogOpen,
    confirmDelete,
    startEdit,
    handleDeleteFile,
    overlayPanel,
    isReadOnlyDir,
    refreshFiles,
  } = useVault();

  // Reload vault files silently after rules/examples sync completes
  const { syncVersion } = useOrgDbConfig();
  const skipInitialRef = useRef(true);
  useEffect(() => {
    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      return;
    }
    refreshFiles();
  }, [syncVersion, refreshFiles]);

  // Notify parent of file actions
  useEffect(() => {
    if (!onFileActions) return;

    if (selectedFile && !draft && !editingFile && !overlayPanel) {
      onFileActions({
        onEdit: () => startEdit(selectedFile),
        onDelete: () => handleDeleteFile(selectedFile.path),
        readOnly: isReadOnlyDir(selectedFile.directory),
      });
    } else {
      onFileActions(null);
    }
  }, [
    selectedFile,
    draft,
    editingFile,
    overlayPanel,
    onFileActions,
    startEdit,
    handleDeleteFile,
    isReadOnlyDir,
  ]);

  // Auto-close mobile drawer when the user navigates to a content view
  // (file selected, audit opened, new draft started, or rules/examples overlay).
  // Directory chevron toggles are navigation within the tree — leave the drawer open.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [selectedFile, showAudit, draft, overlayPanel]);

  if (loading) {
    return <VaultLoadingSkeleton />;
  }

  if (!status?.enabled) {
    return (
      <div className="px-6 py-12 text-center">
        <Icon
          name="FileText"
          className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50"
        />
        <h3 className="mb-1 text-lg font-medium">
          {t("vault.notInitialized")}
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t("vault.notInitializedDesc")}
        </p>
      </div>
    );
  }

  const isCreating = draft !== null;
  const isEditing = editingFile !== null;
  const isPreviewing = !isCreating && !isEditing && selectedFile !== null;

  const renderContentPanel = () => {
    if (overlayPanel === "rules") return <DataSourceRulesModule />;
    if (overlayPanel === "examples") return <DataSourceExamplesModule />;
    if (isCreating) return <VaultCreateForm />;
    if (isEditing) return <VaultEditForm />;
    if (isPreviewing) return <VaultPreview />;
    if (showAudit) return <VaultAudit />;
    return <VaultIntro onShowExample={setExampleModal} />;
  };

  return (
    <>
      {/* Narrow-container-only top bar — hamburger opens the sidebar drawer.
          Hidden by default so wide-screen renders without a flash before the
          container query evaluates; shown only when the container is narrow. */}
      <div className="hidden h-10 shrink-0 items-center border-b px-2 @max-4xl:flex">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Icon name="PanelLeft" size="sm" className="text-inherit" />
          {t("vault.viewContext")}
        </Button>
      </div>

      {/* Mobile sidebar drawer (only triggerable on mobile; portal-rendered) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 pt-10">
          {/* Radix Dialog (which Sheet wraps) requires a title for a11y. The
              drawer's visual identity is the search bar + tree, so the title
              is screen-reader-only. */}
          <SheetTitle className="sr-only">{t("vault.viewContext")}</SheetTitle>
          <VaultSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Inline sidebar — visible by default; hidden when the container is narrow.
            Width + border live here so the column reaches full row height via
            flex `align-self: stretch`. */}
        <div className="w-64 shrink-0 border-r @max-4xl:hidden">
          <VaultSidebar />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">
          {renderContentPanel()}
        </div>
      </div>

      <DeleteConfirmationAlert
        title={t("vault.deleteConfirmTitle")}
        description={t("vault.deleteConfirmDesc")}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      {exampleModal && (
        <VaultExampleModal
          type={exampleModal}
          open={true}
          onOpenChange={(open) => !open && setExampleModal(null)}
        />
      )}
    </>
  );
};
