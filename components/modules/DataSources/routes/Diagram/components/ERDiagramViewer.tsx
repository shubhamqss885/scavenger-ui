"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toPng } from "html-to-image";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { EmptyState } from "@/components/blocks/EmptyState";
import { Loader2, AlertTriangle, Table } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { MermaidDiagram } from "./MermaidDiagram";
import {
  generateERDiagram,
  ERDGenerationError,
} from "../utils/generateERDiagram";
import { ERDiagramToolbar } from "./ERDiagramToolbar";
import { toast } from "sonner";

export function ERDiagramViewer() {
  const { database, loading } = useDatabaseDescription();
  const { t } = useTranslation("database");
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const transformRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const diagramStats = useMemo(() => {
    const tables = database?.tables ?? [];
    const tableCount = tables.length;
    const columnCount = tables.reduce(
      (total, table) => total + (table.table_columns?.length ?? 0),
      0,
    );

    return { tableCount, columnCount };
  }, [database?.tables]);

  // All hooks must be called before any early returns
  const handleRenderError = useCallback(
    (error: Error) => {
      setDiagramError(error.message || t("erDiagram.states.renderFailed"));
    },
    [t],
  );

  const handleDimensionsReady = useCallback((width: number, height: number) => {
    setSvgDimensions({ width, height });
  }, []);

  // Calculate fit scale based on SVG and container dimensions
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current || !svgDimensions) return 1;

    const containerRect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const containerTop = containerRect.top;
    const visibleHeight = Math.min(
      viewportHeight - containerTop,
      containerRect.height,
    );

    // Account for TransformComponent padding
    const padding = 80;

    const availableWidth = containerRect.width - padding;
    // Use actual visible height instead of full container height
    const availableHeight = Math.max(visibleHeight - padding, 300);

    const scaleX = availableWidth / svgDimensions.width;
    const scaleY = availableHeight / svgDimensions.height;

    // Use the smaller scale to ensure content fits
    const scale = Math.min(scaleX, scaleY);

    // Only cap at 1 if we would be zooming IN (scale > 1)
    // Always allow zooming OUT (scale < 1) for large content
    const finalScale = Math.min(scale, 1);

    return finalScale;
  }, [svgDimensions]);

  const handleFitToScreen = useCallback(() => {
    if (transformRef.current && svgDimensions) {
      const scale = calculateFitScale();
      transformRef.current.centerView(scale, 300);
    }
  }, [svgDimensions, calculateFitScale]);

  // Calculate dynamic zoom limits based on content
  const zoomLimits = useMemo(() => {
    if (!svgDimensions) {
      return {
        minScale: 0.1,
        maxScale: 10,
      };
    }

    const fitScale = calculateFitScale();
    // Allow zooming out further than fit scale, and zooming in to reasonable limit
    return {
      minScale: Math.min(fitScale * 0.5, 0.1),
      maxScale: 10,
    };
  }, [svgDimensions, calculateFitScale]);

  // Auto-fit when SVG dimensions are available
  useEffect(() => {
    if (svgDimensions) {
      handleFitToScreen();
    }
  }, [svgDimensions, handleFitToScreen]);

  // Generate Mermaid diagram from tables with error handling
  const diagramCode = useMemo(() => {
    if (!database?.tables) return "";

    try {
      const diagram = generateERDiagram(database.tables);
      setDiagramError(null); // Clear any previous errors
      return diagram;
    } catch (error) {
      if (error instanceof ERDGenerationError) {
        setDiagramError(error.message);
        console.error("ERD Generation Error:", error.message, error.details);
      } else {
        setDiagramError(t("erDiagram.states.renderFailed"));
        console.error("Unexpected error generating diagram:", error);
      }
      return "";
    }
  }, [database?.tables, t]);

  const hasNoTables = !database?.tables || database.tables.length === 0;

  if (loading) {
    return (
      <EmptyState
        icon={Loader2}
        iconClassName="h-8 w-8 text-slate-400 animate-spin"
        title={t("erDiagram.states.generating")}
        subtitle={t("erDiagram.states.analyzingRelationships")}
        variant="loading"
      />
    );
  }

  if (diagramError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        iconClassName="h-12 w-12 text-red-400"
        title={t("erDiagram.states.renderFailed")}
        subtitle={diagramError}
        variant="error"
      />
    );
  }

  if (hasNoTables) {
    return (
      <EmptyState
        icon={Table}
        iconClassName="h-12 w-12 text-slate-400"
        title={t("erDiagram.states.noTables")}
        subtitle={t("erDiagram.states.generateSchemaFirst")}
      />
    );
  }

  const handleExport = async (format: "png" | "svg" | "source") => {
    if (format === "source") {
      // Copy Mermaid source to clipboard
      navigator.clipboard
        .writeText(diagramCode)
        .then(() => {
          toast.success(t("erDiagram.messages.copiedToClipboard"));
        })
        .catch(() => {
          toast.error(t("erDiagram.errors.copyFailed"));
        });
      return;
    }

    // Get the SVG element
    const svgElement = document.querySelector(".mermaid-diagram svg");

    if (!svgElement) {
      toast.error(t("erDiagram.errors.noDiagramToExport"));
      return;
    }

    if (format === "svg") {
      // Export as SVG
      const svgData = svgElement.outerHTML;
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `er-diagram-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("erDiagram.messages.exported"));
    } else if (format === "png") {
      // Export as PNG
      try {
        const diagramContainer = document.querySelector(
          ".mermaid-diagram",
        ) as HTMLElement;

        if (!diagramContainer) {
          toast.error(t("erDiagram.errors.noDiagramToExport"));
          return;
        }

        const complexityScore = Math.max(
          diagramStats.columnCount,
          diagramStats.tableCount * 8,
        );
        const normalizedComplexity = Math.max(complexityScore, 40);
        const dynamicPixelRatio = Math.min(
          42,
          Math.max(3, 2 + normalizedComplexity / 45),
        );

        const dataUrl = await toPng(diagramContainer, {
          quality: 1.0,
          backgroundColor: "#ffffff",
          pixelRatio: dynamicPixelRatio,
          cacheBust: true,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `er-diagram-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("erDiagram.messages.exported"));
      } catch (error) {
        console.error("Failed to export PNG:", error);
        toast.error(t("erDiagram.errors.exportPNGFailed"));
      }
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <ERDiagramToolbar
        onExport={handleExport}
        onZoomIn={() => transformRef.current?.zoomIn(0.1)}
        onZoomOut={() => transformRef.current?.zoomOut(0.1)}
        onFitToScreen={handleFitToScreen}
      />
      <div
        ref={containerRef}
        className="max-h-[calc(100vh-182px)] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={zoomLimits.minScale}
          maxScale={zoomLimits.maxScale}
          centerOnInit={true}
          wheel={{
            step: 0.005,
            wheelDisabled: false,
            touchPadDisabled: false,
            smoothStep: 0.002,
          }}
          panning={{
            disabled: false,
            velocityDisabled: false,
            lockAxisX: false,
            lockAxisY: false,
          }}
          doubleClick={{
            disabled: false,
            step: 0.25,
            mode: "zoomIn",
          }}
          alignmentAnimation={{ disabled: true }}
          velocityAnimation={{ disabled: false }}
          limitToBounds={true}
          pinch={{ disabled: false }}
          centerZoomedOut={true}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
            }}
            contentStyle={{
              flex: 1,
              padding: "2rem",
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            <MermaidDiagram
              diagram={diagramCode}
              onRenderError={handleRenderError}
              onDimensionsReady={handleDimensionsReady}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
