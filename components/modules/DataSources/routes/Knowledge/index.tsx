"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { EmptyState } from "@/components/blocks/EmptyState";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getKnowledgeGraphStructure,
  getKnowledgeGraphStatus,
  generateKnowledgeGraph,
  getKnowledgeGraphGenerationStatus,
  type KGGraphStructure,
  type KGStatus,
  type KGGenerationStatus,
} from "@/lib/services/agenticChatService";
import { GraphView } from "./components/GraphView";
import { TablesView } from "./components/TablesView";
import { ColumnsView } from "./components/ColumnsView";
import { RelationshipsView } from "./components/RelationshipsView";
import { ViewsView } from "./components/ViewsView";
import { transformToTabularData, type KgSubTab } from "./types";

const LoadingSkeleton = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="space-y-4 text-center">
      <Skeleton className="mx-auto h-64 w-64 rounded-full" />
      <Skeleton className="mx-auto h-4 w-32" />
    </div>
  </div>
);

type SubTabConfig = {
  id: KgSubTab;
  labelKey: string;
  icon: string;
};

const SUB_TABS: SubTabConfig[] = [
  { id: "graph", labelKey: "vault.kg.tabs.graph", icon: "Share2" },
  { id: "tables", labelKey: "vault.kg.tabs.tables", icon: "Table" },
  { id: "columns", labelKey: "vault.kg.tabs.columns", icon: "Columns3" },
  {
    id: "relationships",
    labelKey: "vault.kg.tabs.relationships",
    icon: "Link",
  },
  { id: "views", labelKey: "vault.kg.tabs.views", icon: "Eye" },
];

const POLL_INTERVAL = 3000; // 3 seconds

const KnowledgeContent = ({ orgdbId }: { orgdbId: string }) => {
  const { t } = useTranslation("database");
  const [activeTab, setActiveTab] = useState<KgSubTab>("tables");
  const [status, setStatus] = useState<KGStatus | null>(null);
  const [structure, setStructure] = useState<KGGraphStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] =
    useState<KGGenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Fetch structure directly (used when we already know KG exists)
  const fetchStructure = useCallback(async () => {
    try {
      const data = await getKnowledgeGraphStructure(orgdbId);
      setStructure(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("vault.kg.fetchError");
      setError(message);
    }
  }, [orgdbId, t]);

  // Fetch status first, then structure if KG exists
  const loadStatusAndStructure = useCallback(async () => {
    try {
      const kgStatus = await getKnowledgeGraphStatus(orgdbId);
      setStatus(kgStatus);
      if (kgStatus.graph_kg_exists) {
        const data = await getKnowledgeGraphStructure(orgdbId);
        setStructure(data);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("vault.kg.fetchError");
      setError(message);
    }
  }, [orgdbId, t]);

  // Set status from generation status response (avoids extra API call)
  const setStatusFromGeneration = useCallback(
    (genStatus: KGGenerationStatus) => {
      setStatus({
        orgdb_id: genStatus.orgdb_id,
        kg_name: genStatus.kg_name || "",
        kg_created_at: genStatus.kg_created_at,
        db_kg_exists: true,
        graph_kg_exists: true,
      });
    },
    [],
  );

  const pollGenerationStatus = useCallback(async () => {
    try {
      const genStatus = await getKnowledgeGraphGenerationStatus(orgdbId);
      setGenerationStatus(genStatus);

      if (genStatus.status === "completed") {
        stopPolling();
        setGenerating(false);
        setGenerationStatus(null);
        setStatusFromGeneration(genStatus);
        toast.success(t("vault.kg.generateSuccess"));
        await fetchStructure();
      } else if (genStatus.status === "failed") {
        stopPolling();
        setGenerating(false);
        setGenerationStatus(null);
        toast.error(genStatus.error || t("vault.kg.generateError"));
      }
    } catch {
      // Silently fail polling - will retry on next interval
    }
  }, [orgdbId, stopPolling, fetchStructure, setStatusFromGeneration, t]);

  // Check KG status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if there's an ongoing generation
        const genStatus = await getKnowledgeGraphGenerationStatus(orgdbId);

        if (
          genStatus.status === "pending" ||
          genStatus.status === "in_progress"
        ) {
          setGenerating(true);
          setGenerationStatus(genStatus);
          // Start polling
          pollIntervalRef.current = setInterval(
            pollGenerationStatus,
            POLL_INTERVAL,
          );
        } else if (genStatus.status === "completed") {
          // KG already exists - fetch structure directly without calling status API
          setStatusFromGeneration(genStatus);
          await fetchStructure();
        } else {
          // Unknown status or failed - check actual KG status
          await loadStatusAndStructure();
        }
      } catch {
        // If generation status fails, try to load structure directly
        await loadStatusAndStructure();
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    return () => stopPolling();
  }, [
    orgdbId,
    fetchStructure,
    loadStatusAndStructure,
    pollGenerationStatus,
    setStatusFromGeneration,
    stopPolling,
  ]);

  const handleGenerateKg = async () => {
    try {
      setGenerating(true);
      setGenerationStatus({
        orgdb_id: orgdbId,
        status: "pending",
        progress: 0,
        error: null,
        started_at: null,
        kg_name: null,
        kg_created_at: null,
      });

      await generateKnowledgeGraph(orgdbId);

      // Start polling for status
      pollIntervalRef.current = setInterval(
        pollGenerationStatus,
        POLL_INTERVAL,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("vault.kg.generateError");
      toast.error(message);
      setGenerating(false);
      setGenerationStatus(null);
    }
  };

  const tabularData = useMemo(
    () => (structure ? transformToTabularData(structure) : null),
    [structure],
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Icon name="AlertTriangle" size="lg" variant="destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => globalThis.window.location.reload()}
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  // KG is being generated - show progress
  if (generating && generationStatus) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <Icon name="Share2" size="xl" className="text-primary" />
        <div className="w-full max-w-md space-y-3">
          <div className="text-center">
            <p className="text-lg font-medium">
              {t("vault.kg.generatingTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("vault.kg.generatingDesc")}
            </p>
          </div>
          <Progress value={generationStatus.progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {generationStatus.progress}% {t("vault.kg.complete")}
          </p>
        </div>
      </div>
    );
  }

  // KG doesn't exist - show generate button
  if (!status?.graph_kg_exists) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Icon name="Share2" size="xl" className="text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-lg font-medium">{t("vault.kg.notGenerated")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("vault.kg.notGeneratedDesc")}
          </p>
        </div>
        <Button onClick={handleGenerateKg} disabled={generating}>
          <Icon name="Zap" size="sm" className="mr-2" />
          {t("vault.kg.generate")}
        </Button>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
        <Icon name="Share2" size="lg" className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("vault.kg.noData")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex gap-1">
          {SUB_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "gap-1.5 text-xs",
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon name={tab.icon as "Table"} size="xs" />
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>
        {status?.kg_created_at && (
          <p className="text-xs text-muted-foreground">
            {t("vault.kg.lastSynced")}:{" "}
            {new Date(status.kg_created_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "graph" && <GraphView structure={structure} />}
        {activeTab === "tables" && tabularData && (
          <div className="h-full overflow-auto p-4">
            <TablesView tables={tabularData.tables} />
          </div>
        )}
        {activeTab === "columns" && tabularData && (
          <div className="h-full overflow-auto p-4">
            <ColumnsView columns={tabularData.columns} />
          </div>
        )}
        {activeTab === "relationships" && tabularData && (
          <div className="h-full overflow-auto p-4">
            <RelationshipsView relationships={tabularData.relationships} />
          </div>
        )}
        {activeTab === "views" && tabularData && (
          <div className="h-full overflow-auto p-4">
            <ViewsView views={tabularData.views} />
          </div>
        )}
      </div>
    </div>
  );
};

// Module export for the route page
export const DataSourceKnowledgeModule = () => {
  const { loading, databaseId } = useDatabaseDescription();

  if (!databaseId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          iconClassName="h-12 w-12 text-red-400"
          title="Database ID not found"
          variant="error"
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full w-full">
      <KnowledgeContent orgdbId={databaseId} />
    </div>
  );
};
