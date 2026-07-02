"use client";

import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { VaultLoadingSkeleton } from "./components/VaultLoadingSkeleton";
import { EmptyState } from "@/components/blocks/EmptyState";
import { AlertTriangle } from "lucide-react";
import { VaultProvider } from "./context/VaultContext";
import { VaultContent, type FileActions } from "./components/VaultContent";

type Props = Readonly<{
  onFileActions?: (actions: FileActions | null) => void;
}>;

export const DataSourceVaultModule = ({ onFileActions }: Props = {}) => {
  const { loading, databaseId } = useDatabaseDescription();

  if (!databaseId) {
    return (
      <div className="mx-auto mt-4 max-w-[1400px] px-6 pb-6">
        <EmptyState
          icon={AlertTriangle}
          iconClassName="h-12 w-12 text-red-400"
          title="Database ID not found"
          variant="error"
        />
      </div>
    );
  }

  return (
    <div className="flex h-0 min-h-full w-full flex-col overflow-hidden @container">
      {loading ? (
        <VaultLoadingSkeleton />
      ) : (
        <VaultProvider orgdbId={databaseId}>
          <VaultContent onFileActions={onFileActions} />
        </VaultProvider>
      )}
    </div>
  );
};
