"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

interface ExportProfilerButtonProps {
  filename?: string;
}

export const ExportProfilerButton: React.FC<ExportProfilerButtonProps> = ({
  filename,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useTranslation("database");

  const exportAsPDF = async () => {
    const element = document.getElementById("profiler-content");

    if (!element) {
      console.error("Profiler content element not found");
      return;
    }

    setIsExporting(true);

    // Toggle export mode: hide tabbed view, show stacked export view
    const tabbedView = element.querySelector(".profiler-tabs-container");
    const exportView = element.querySelector(".column-analysis-export-view");

    if (tabbedView) tabbedView.classList.add("hidden");
    if (exportView) exportView.classList.remove("hidden");

    // Small delay to allow DOM to update
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // Lazy-load the export libs (jsPDF ~15 MB) only on click.
      const { toPng } = await import("html-to-image");
      const { default: jsPDF } = await import("jspdf");

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        // Scale content to 110% regardless of browser zoom
        style: {
          transform: "scale(1.1)",
          transformOrigin: "top left",
        },
        width: element.offsetWidth * 1.1,
        height: element.offsetHeight * 1.1,
        filter: (node) => {
          // Exclude elements with profiler-export-btn class
          if (node instanceof HTMLElement) {
            return !node.classList.contains("profiler-export-btn");
          }
          return true;
        },
      });

      // Get image dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      // Create PDF with portrait orientation for profiler content
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (img.height * imgWidth) / img.width;

      // Handle multi-page if content is taller than one page
      const pageHeight = pdfHeight - 20; // 10mm margin top and bottom
      let heightLeft = imgHeight;
      let position = 10; // Start with 10mm top margin

      // Add image to first page
      pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const outputFilename = filename
        ? `${filename.replaceAll(/[^a-zA-Z0-9-_]/g, "-")}.pdf`
        : "data-profiler-export.pdf";
      pdf.save(outputFilename);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error(t("profiler.export.error"));
    } finally {
      // Restore normal view: show tabbed view, hide export view
      if (tabbedView) tabbedView.classList.remove("hidden");
      if (exportView) exportView.classList.add("hidden");
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportAsPDF}
      disabled={isExporting}
      className="profiler-export-btn gap-2"
    >
      {isExporting ? (
        <>
          <Icon name="Loader2" size="xs" className="animate-spin" />
          {t("profiler.export.exporting")}
        </>
      ) : (
        <>
          <Icon name="Download" size="xs" />
          {t("profiler.export.button")}
        </>
      )}
    </Button>
  );
};
