"use client";

import { Button } from "@/components/ui/button";
// Dropdown menu imports - keeping for future multi-format export support
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

type ERDiagramToolbarProps = Readonly<{
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  onExport?: (format: "png" | "svg" | "source") => void;
}>;

export function ERDiagramToolbar({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onExport,
}: ERDiagramToolbarProps) {
  const { t } = useTranslation("database");

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          disabled={!onZoomIn}
        >
          <Icon name="ZoomIn" size="sm" className="mr-2" />
          {t("erDiagram.actions.zoomIn")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          disabled={!onZoomOut}
        >
          <Icon name="ZoomOut" size="sm" className="mr-2" />
          {t("erDiagram.actions.zoomOut")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onFitToScreen}
          disabled={!onFitToScreen}
        >
          <Icon name="Maximize2" size="sm" className="mr-2" />
          {t("erDiagram.actions.fitToScreen")}
        </Button>
      </div>

      {/* Direct export button - saves a click since only PNG export is currently active */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport?.("png")}
        disabled={!onExport}
      >
        <Icon name="Download" size="sm" className="mr-2" />
        {t("erDiagram.actions.exportPNG")}
      </Button>

      {/* Full dropdown implementation - commented out for future multi-format support
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Icon name="Download" size="sm" className="mr-2" />
            {t("erDiagram.actions.export")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onExport?.("png")}
            disabled={!onExport}
          >
            <Icon name="FileImage" size="sm" className="mr-2" />
            {t("erDiagram.actions.exportPNG")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onExport?.("svg")}
            disabled={!onExport}
          >
            <Icon name="FileCode" size="sm" className="mr-2" />
            {t("erDiagram.actions.exportSVG")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onExport?.("source")}
            disabled={!onExport}
          >
            <Icon name="Copy" size="sm" className="mr-2" />
            {t("erDiagram.actions.copySource")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      */}
    </div>
  );
}
