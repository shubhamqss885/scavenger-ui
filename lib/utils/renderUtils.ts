import type { Options as Html2CanvasOptions } from "html2canvas";

export interface ChartRenderOptions extends Partial<Html2CanvasOptions> {
  adjustLegend?: boolean;
  preserveAspectRatio?: boolean;
}

interface CloneElementResult {
  clonedElement: HTMLElement;
  container: HTMLElement;
}

export const renderChartToCanvas = async (
  container: HTMLElement,
  options: ChartRenderOptions = {},
): Promise<HTMLCanvasElement> => {
  const {
    adjustLegend = true,
    preserveAspectRatio = true,
    ...html2CanvasOptions
  } = options;

  // Lazy-load html2canvas (~4.6 MB) only when a chart is actually exported,
  // keeping it out of the initial bundle (e.g. the agentic chat route).
  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(container, {
    scale: window.devicePixelRatio,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    ...html2CanvasOptions,
    onclone: (clonedDoc) => {
      const clonedChart = clonedDoc.querySelector("[data-chart]");

      if (clonedChart) {
        (clonedChart as HTMLElement).style.paddingBottom = "12px";

        if (preserveAspectRatio) {
          (clonedChart as HTMLElement).style.width = "100%";
          (clonedChart as HTMLElement).style.height = "100%";
        }
      }

      if (adjustLegend) {
        const legendWrapper = clonedChart?.querySelector(
          ".recharts-legend-wrapper",
        );

        if (legendWrapper) {
          (legendWrapper as HTMLElement).style.bottom = "-4px";
        }

        const legendContent = clonedChart?.querySelectorAll(".legend-label");

        if (legendContent && legendContent.length > 0) {
          legendContent.forEach((element) => {
            (element as HTMLElement).style.marginTop = "-14px";
          });
        }
      }

      // Allow additional customization from the caller
      if (html2CanvasOptions.onclone) {
        html2CanvasOptions.onclone(clonedDoc, container);
      }
    },
  });
};

export const prepareDashboardForExport = (
  originalElement: HTMLElement,
): CloneElementResult => {
  // Clone the element
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;

  // Add base styling
  clonedElement.style.padding = "20px";
  clonedElement.style.backgroundColor = "white";

  // Hide chart type selector and table header
  const chartSelector = clonedElement.querySelectorAll(
    ".text2sql-chart-type-selector, .text2sql-table-header",
  );
  chartSelector?.forEach((element) => {
    (element as HTMLElement).style.display = "none";
  });

  // Hide text2sql tabs
  const text2SqlTabs = clonedElement.querySelectorAll(".text2sql-tabs-list");
  text2SqlTabs?.forEach((element) => {
    (element as HTMLElement).style.display = "none";
  });

  // Fix legend content
  const legendContent = clonedElement.querySelectorAll(".legend-label");
  legendContent?.forEach((element) => {
    (element as HTMLElement).style.marginTop = "-14px";
  });

  // Fix chart title
  const chartTitle = clonedElement.querySelectorAll(".chart-title");
  chartTitle?.forEach((element) => {
    (element as HTMLElement).style.marginTop = "-16px";
    (element as HTMLElement).style.paddingBottom = "0px";
    (element as HTMLElement).style.lineHeight = "40px";
  });

  // Fix Card Date & Time
  const cardDate = clonedElement.querySelectorAll(".text2sql-card-date");
  cardDate?.forEach((element) => {
    (element as HTMLElement).style.position = "relative";
    (element as HTMLElement).style.top = "-6px";
    (element as HTMLElement).style.lineHeight = "18px";
  });

  // Fix Chart Container
  const chartContainer = clonedElement.querySelectorAll(
    ".text2sql-chart-container",
  );
  chartContainer?.forEach((element) => {
    // Reset all padding to ensure consistency
    (element as HTMLElement).style.paddingTop = "4px";
    (element as HTMLElement).style.paddingBottom = "8px";
  });

  // Create and setup container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = originalElement.offsetWidth + 40 + "px";
  container.appendChild(clonedElement);
  document.body.appendChild(container);

  return { clonedElement, container };
};
