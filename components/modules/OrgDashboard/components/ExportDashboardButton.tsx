import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Icon } from "@/components/ui/icon";
import { prepareDashboardForExport } from "@/lib/utils/renderUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface ExportButtonProps {
  filename?: string;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ filename, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation("dashboard");

  const toggleDropdown = (open: boolean) => setIsOpen(open);

  const getTargetElement = async () => {
    const originalElement =
      document.getElementById("project-pinned-card") ||
      document.getElementById("org-dashboard-grid");

    if (!originalElement) return null;

    // Find the parent container with preview-container class
    const parentContainer = originalElement.closest(".preview-container");

    const wasAlreadyInPreviewMode = parentContainer?.classList.contains(
      "export-preview-mode",
    );

    // Always apply export-preview-mode for consistent export
    if (parentContainer && !wasAlreadyInPreviewMode) {
      parentContainer.classList.add("export-preview-mode");
      // Wait for layout recalculation
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const result = prepareDashboardForExport(originalElement);

    // Remove export-preview-mode if we added it temporarily
    if (parentContainer && !wasAlreadyInPreviewMode) {
      parentContainer.classList.remove("export-preview-mode");
    }

    return result;
  };

  const exportAsPDF = async () => {
    try {
      // Lazy-load export libs (jsPDF ~15 MB) only on click.
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const result = await getTargetElement();

      if (!result) return;

      const { clonedElement, container } = result;

      clonedElement.style.height = `${clonedElement.scrollHeight}px`;
      clonedElement.style.overflow = "unset";

      const canvas = await html2canvas(clonedElement, { scale: 2 });
      const image = canvas.toDataURL("image/png");

      container.remove();

      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasAspect = canvas.width / canvas.height;
      const pdfAspect = pdfWidth / pdfHeight;

      let imgWidth, imgHeight;

      if (canvasAspect > pdfAspect) {
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / canvasAspect;
      } else {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * canvasAspect;
      }

      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = 0;

      pdf.addImage(image, "PNG", xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`${filename ?? "dashboard-export"}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const tempContainer = document.querySelector('div[style*="-9999px"]');

      if (tempContainer) {
        tempContainer.remove();
      }
    }
  };

  const exportAsPPT = async () => {
    try {
      // Lazy-load export libs (pptxgenjs ~5 MB) only on click.
      const { default: html2canvas } = await import("html2canvas");
      const { default: PptxGenJS } = await import("pptxgenjs");

      const result = await getTargetElement();

      if (!result) return;

      const { clonedElement, container } = result;

      clonedElement.style.height = `${clonedElement.scrollHeight}px`;
      clonedElement.style.overflow = "unset";

      const canvas = await html2canvas(clonedElement, { scale: 2 });
      const image = canvas.toDataURL("image/png");

      container.remove();

      const ppt = new PptxGenJS();
      const slide = ppt.addSlide();

      const slideWidth = 10;
      const slideHeight = 5.625;

      const canvasAspect = canvas.width / canvas.height;
      const slideAspect = slideWidth / slideHeight;

      let imgWidth, imgHeight;
      if (canvasAspect > slideAspect) {
        imgWidth = slideWidth;
        imgHeight = slideWidth / canvasAspect;
      } else {
        imgHeight = slideHeight;
        imgWidth = slideHeight * canvasAspect;
      }

      const xOffset = (slideWidth - imgWidth) / 2;
      const yOffset = 0;

      slide.addImage({
        data: image,
        x: xOffset,
        y: yOffset,
        w: imgWidth,
        h: imgHeight,
      });

      await ppt.writeFile({
        fileName: `${filename ?? "dashboard-export"}.pptx`,
      });
    } catch (error) {
      console.error("Error exporting PPT:", error);
      const tempContainer = document.querySelector('div[style*="-9999px"]');

      if (tempContainer) {
        tempContainer.remove();
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={toggleDropdown}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border-[1px] px-4 py-2 text-xs sm:w-56",
            isOpen
              ? "border-gray-500 bg-white"
              : "border-slate-200 hover:bg-slate-100",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Icon name="Download" size="sm" variant="foreground" />
            <span>{t("orgDashboard.export.exportDashboard")}</span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 transform transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-48 rounded-md text-xs shadow-md",
          isOpen
            ? "border-gray-500 bg-white"
            : "border-slate-200 hover:bg-slate-100",
        )}
      >
        <DropdownMenuItem
          onClick={exportAsPDF}
          className="w-full cursor-pointer px-4 py-2 hover:bg-gray-100"
        >
          {t("orgDashboard.export.exportAsPDF")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportAsPPT}
          className="w-full cursor-pointer px-4 py-2 hover:bg-gray-100"
        >
          {t("orgDashboard.export.exportAsPPT")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
