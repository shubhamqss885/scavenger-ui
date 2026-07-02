import { VaultLoadingSkeleton } from "@/components/modules/DataSources/routes/Vault/components/VaultLoadingSkeleton";

export default function DataSourceContextLoading() {
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex h-0 min-h-full w-full flex-col overflow-hidden">
          <VaultLoadingSkeleton />
        </div>
      </div>
    </div>
  );
}
