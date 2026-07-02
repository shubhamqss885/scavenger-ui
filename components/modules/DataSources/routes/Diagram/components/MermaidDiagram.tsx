"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/client";

type MermaidDiagramProps = Readonly<{
  diagram: string;
  onRenderError?: (error: Error) => void;
  onDimensionsReady?: (width: number, height: number) => void;
}>;

// Cache the mermaid module to avoid re-importing
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;

export function MermaidDiagram({
  diagram,
  onRenderError,
  onDimensionsReady,
}: MermaidDiagramProps) {
  const { t } = useTranslation("database");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [isLoadingMermaid, setIsLoadingMermaid] = useState(true);

  useEffect(() => {
    if (!diagram) return;

    let mounted = true;

    const renderDiagram = async () => {
      try {
        setIsRendering(true);

        // Lazy load mermaid
        if (!mermaidPromise) {
          mermaidPromise = import("mermaid");
        }

        const mermaidModule = await mermaidPromise;
        const mermaid = mermaidModule.default;

        setIsLoadingMermaid(false);

        // Configure Mermaid with theme
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral", // Use the built-in neutral theme
          securityLevel: "loose",
          maxTextSize: 50000,
          maxEdges: 500,
          er: {
            layoutDirection: "LR",
            minEntityWidth: 120,
            minEntityHeight: 80,
            entityPadding: 12,
            useMaxWidth: true,
            diagramPadding: 20,
          },
        });

        // Generate unique ID for the diagram
        const id = `mermaid-${Date.now()}`;

        // Render the diagram using mermaid
        const { svg } = await mermaid.render(id, diagram);

        // Only update if component is still mounted
        if (!mounted) return;

        // Set the SVG content
        setRenderedSvg(svg);
        setIsRendering(false);

        // Measure and report SVG dimensions after a brief delay
        if (onDimensionsReady) {
          const timeoutId = setTimeout(() => {
            // Only proceed if component is still mounted
            if (!mounted || !containerRef.current) return;

            const svgElement = containerRef.current.querySelector("svg");

            if (svgElement) {
              try {
                // Use client dimensions (actual rendered size) instead of bbox (mathematical size)
                const width = svgElement.clientWidth || 800;
                const height = svgElement.clientHeight || 600;

                onDimensionsReady(width, height);
              } catch {
                // Fallback to client dimensions
                const width = svgElement.clientWidth || 800;
                const height = svgElement.clientHeight || 600;

                onDimensionsReady(width, height);
              }
            }
          }, 100); // Slightly longer delay to ensure SVG is fully rendered

          // Store timeout for cleanup
          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Failed to render Mermaid diagram:", error);
        setIsRendering(false);
        setIsLoadingMermaid(false);
        if (mounted) {
          if (error instanceof Error && error.message.includes("import")) {
            onRenderError?.(new Error(t("erDiagram.errors.loadEngineFailed")));
          } else {
            onRenderError?.(error as Error);
          }
        }
      }
    };

    renderDiagram();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [diagram, onRenderError]); // Remove theme dependency to avoid unnecessary re-renders

  if (isLoadingMermaid) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-sm text-slate-500">
          {t("erDiagram.states.loadingEngine")}
        </div>
      </div>
    );
  }

  if (isRendering) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-sm text-slate-500">
          {t("erDiagram.states.rendering")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: renderedSvg }}
    />
  );
}
