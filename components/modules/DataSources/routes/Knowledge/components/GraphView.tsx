"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/client";
import type { KGGraphStructure } from "@/lib/services/agenticChatService";
import { formatTableName } from "../types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

type GraphNode = {
  id: string;
  name: string;
  displayName: string;
  type: "table" | "column" | "view";
  description?: string;
  color?: string;
  rowCount?: number | null;
  columnCount?: number;
  dataType?: string;
  isPk?: boolean;
};

type GraphLink = {
  source: string;
  target: string;
  type: "has_column" | "relation";
  label?: string;
  leftTable?: string;
  rightTable?: string;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const GraphSkeleton = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="space-y-4 text-center">
      <Skeleton className="mx-auto h-64 w-64 rounded-full" />
      <Skeleton className="mx-auto h-4 w-32" />
    </div>
  </div>
);

const NODE_COLORS = {
  table: "#3b82f6",
  column: "#94a3b8",
  view: "#8b5cf6",
  relation: "#f97316",
};

const NODE_TYPE_KEYS: Record<GraphNode["type"], string> = {
  table: "vault.kg.typeTable",
  view: "vault.kg.typeView",
  column: "vault.kg.typeColumn",
};

const getAbbreviation = (name: string): string => {
  const parts = name.split("_").filter((p) => p.length > 0);

  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();

  return parts
    .slice(0, 3)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
};

const transformToGraphData = (
  structure: KGGraphStructure,
  showColumns: boolean,
): GraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeSet = new Set<string>();
  const columnCounts: Record<string, number> = {};

  if (structure.edges.Table_OUT?.HAS_COLUMN) {
    for (const [tableName, columns] of Object.entries(
      structure.edges.Table_OUT.HAS_COLUMN,
    )) {
      columnCounts[tableName] = columns.length;
    }
  }

  for (const [tableId, tableData] of Object.entries(structure.nodes.Table)) {
    if (!nodeSet.has(tableId)) {
      nodes.push({
        id: tableId,
        name: tableId,
        displayName: formatTableName(tableId),
        type: "table",
        description: tableData.description || undefined,
        color: NODE_COLORS.table,
        rowCount: tableData.row_count,
        columnCount: columnCounts[tableId] || 0,
      });
      nodeSet.add(tableId);
    }
  }

  if (structure.nodes.View) {
    for (const [viewId, viewData] of Object.entries(structure.nodes.View)) {
      if (!nodeSet.has(viewId)) {
        nodes.push({
          id: viewId,
          name: viewId,
          displayName: formatTableName(viewId),
          type: "view",
          description: viewData.description || undefined,
          color: NODE_COLORS.view,
          rowCount: viewData.row_count,
        });
        nodeSet.add(viewId);
      }
    }
  }

  if (showColumns && structure.nodes.Column) {
    for (const [columnId, columnData] of Object.entries(
      structure.nodes.Column,
    )) {
      if (!nodeSet.has(columnId)) {
        nodes.push({
          id: columnId,
          name: columnData.name,
          displayName: columnData.name,
          type: "column",
          description: columnData.description || undefined,
          color: NODE_COLORS.column,
          dataType: columnData.data_type,
          isPk: columnData.is_pk,
        });
        nodeSet.add(columnId);
      }
    }

    if (structure.edges.Table_OUT?.HAS_COLUMN) {
      for (const [tableName, columns] of Object.entries(
        structure.edges.Table_OUT.HAS_COLUMN,
      )) {
        for (const col of columns) {
          if (nodeSet.has(tableName) && nodeSet.has(col.column_id)) {
            links.push({
              source: tableName,
              target: col.column_id,
              type: "has_column",
            });
          }
        }
      }
    }
  }

  if (structure.edges.Relation_OUT) {
    for (const [, relation] of Object.entries(structure.edges.Relation_OUT)) {
      if (
        nodeSet.has(relation.LEFT_TABLE) &&
        nodeSet.has(relation.RIGHT_TABLE)
      ) {
        links.push({
          source: relation.LEFT_TABLE,
          target: relation.RIGHT_TABLE,
          type: "relation",
          label: relation.COLS.map(
            ([l, r]) => `${l.split(".")[1] || l} → ${r.split(".")[1] || r}`,
          ).join(", "),
          leftTable: formatTableName(relation.LEFT_TABLE),
          rightTable: formatTableName(relation.RIGHT_TABLE),
        });
      }
    }
  }

  return { nodes, links };
};

type Props = Readonly<{
  structure: KGGraphStructure;
}>;

export const GraphView = ({ structure }: Props) => {
  const { t } = useTranslation("database");
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [dimensions, setDimensions] = useState(() => ({
    width:
      typeof globalThis.window !== "undefined"
        ? globalThis.window.innerWidth - 250
        : 1000,
    height:
      typeof globalThis.window !== "undefined"
        ? globalThis.window.innerHeight - 200
        : 600,
  }));

  useEffect(() => {
    if (graphRef.current && graphData) {
      graphRef.current.d3Force("charge")?.strength(-200).distanceMax(300);
      graphRef.current.d3Force("link")?.distance(60);
      graphRef.current.d3Force("center")?.strength(0.05);
    }
  }, [graphData]);

  const handleEngineStop = useCallback(() => {
    graphRef.current?.pauseAnimation();
  }, []);

  useEffect(() => {
    setGraphData(transformToGraphData(structure, showColumns));
    graphRef.current?.resumeAnimation();
  }, [showColumns, structure]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: globalThis.window.innerWidth - 250,
        height: globalThis.window.innerHeight - 200,
      });
    };
    globalThis.window.addEventListener("resize", updateDimensions);
    return () =>
      globalThis.window.removeEventListener("resize", updateDimensions);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as GraphNode | null);
    if (node) setHoveredLink(null);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLinkHover = useCallback((link: any) => {
    setHoveredLink(link as GraphLink | null);
    if (link) setHoveredNode(null);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number): void => {
      const n = node as GraphNode & { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const nodeSize = n.type === "column" ? 6 : 12;

      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = n.color || NODE_COLORS.table;
      ctx.fill();

      if (n.type === "column" && n.isPk) {
        ctx.beginPath();
        ctx.arc(x, y, nodeSize + 2, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (n.type !== "column" && globalScale > 0.4) {
        const abbr = getAbbreviation(n.name);
        ctx.font = `600 ${Math.min(9, 10 / globalScale)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(abbr, x, y);
      }
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D): void => {
      const l = link as GraphLink & {
        source: { x?: number; y?: number };
        target: { x?: number; y?: number };
      };
      ctx.beginPath();
      ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
      ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
      ctx.strokeStyle =
        l.type === "has_column"
          ? "rgba(148, 163, 184, 0.3)"
          : "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = l.type === "has_column" ? 0.5 : 1;
      ctx.stroke();
    },
    [],
  );

  const legend = useMemo(() => {
    const items = [
      { color: NODE_COLORS.table, label: t("vault.kg.legendTable") },
      { color: NODE_COLORS.view, label: t("vault.kg.legendView") },
      { color: NODE_COLORS.relation, label: t("vault.kg.legendRelation") },
    ];

    if (showColumns)
      items.push({
        color: NODE_COLORS.column,
        label: t("vault.kg.legendColumn"),
      });

    return items;
  }, [t, showColumns]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <Icon name="Share2" size="lg" className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("vault.kg.noData")}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        nodeRelSize={4}
        linkWidth={2}
        cooldownTicks={80}
        d3AlphaDecay={0.08}
        d3VelocityDecay={0.5}
        warmupTicks={50}
        onEngineStop={handleEngineStop}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={0.2}
        maxZoom={10}
      />

      <div className="absolute left-4 top-4 flex gap-2">
        <Button
          variant={showColumns ? "default" : "outline"}
          size="sm"
          onClick={() => setShowColumns((v) => !v)}
          className="text-xs"
        >
          <Icon name="Columns3" size="xs" className="mr-1" />
          {t("vault.kg.showColumns")}
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t("vault.kg.legend")}
        </p>
        <div className="space-y-1.5">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">
          {t("vault.kg.hint")}
        </p>
      </div>

      {hoveredNode && (
        <div className="absolute right-4 top-4 max-w-sm rounded-md border bg-background/95 p-3 shadow-md backdrop-blur">
          <p className="text-sm font-semibold text-foreground">
            {hoveredNode.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(NODE_TYPE_KEYS[hoveredNode.type])}
          </p>
          <div className="mt-2 space-y-1 border-t pt-2">
            {hoveredNode.type === "column" && hoveredNode.dataType && (
              <p className="text-xs text-muted-foreground">
                {t("vault.kg.dataType")}:{" "}
                <span className="font-medium text-foreground">
                  {hoveredNode.dataType}
                </span>
              </p>
            )}
            {hoveredNode.type === "column" && hoveredNode.isPk && (
              <p className="text-xs font-medium text-amber-600">
                {t("vault.kg.primaryKey")}
              </p>
            )}
            {hoveredNode.columnCount !== undefined &&
              hoveredNode.columnCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {hoveredNode.columnCount}
                  </span>{" "}
                  {t("vault.kg.columns")}
                </p>
              )}
            {hoveredNode.rowCount != null && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {hoveredNode.rowCount.toLocaleString()}
                </span>{" "}
                {t("vault.kg.rows")}
              </p>
            )}
          </div>
          {hoveredNode.description && (
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              {hoveredNode.description}
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] text-slate-400">
            {hoveredNode.name}
          </p>
        </div>
      )}

      {hoveredLink && (
        <div className="absolute right-4 top-4 max-w-sm rounded-md border bg-background/95 p-3 shadow-md backdrop-blur">
          <p className="text-sm font-semibold text-foreground">
            {t("vault.kg.relationship")}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs">
              <span className="font-medium text-blue-600">
                {hoveredLink.leftTable}
              </span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-medium text-blue-600">
                {hoveredLink.rightTable}
              </span>
            </p>
            {hoveredLink.label && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {hoveredLink.label}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground">
        {graphData.nodes.length} {t("vault.kg.nodes")} ·{" "}
        {graphData.links.length} {t("vault.kg.edges")}
      </div>
    </div>
  );
};
