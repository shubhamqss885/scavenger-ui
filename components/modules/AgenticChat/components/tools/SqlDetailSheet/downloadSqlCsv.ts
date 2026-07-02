import { getAgenticTableDownloadLink } from "@/lib/services/agenticChatService";
import type { SqlBlock } from "../../../types";
import { extractSqlTitle, tableToCsv } from "../../../utils";

const buildCsvFilename = (sql: string): string => {
  const title = extractSqlTitle(sql);
  const date = new Date().toISOString().split("T")[0];
  const safeName = title
    ? title
        .toLowerCase()
        .replaceAll(/\s+/g, "_")
        .replaceAll(/[^\w-]/g, "") || "query_export"
    : "query_export";

  return `${safeName}_${date}.csv`;
};

const triggerDownload = (href: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadSqlBlockCsv = async (block: SqlBlock): Promise<void> => {
  const tableData = block.table_data ?? [];

  if (tableData.length === 0) return;

  const filename = buildCsvFilename(block.sql);

  if (block.tool_call_id) {
    const downloadUrl = await getAgenticTableDownloadLink(
      block.tool_call_id,
      filename,
    );
    triggerDownload(downloadUrl, filename);
    return;
  }

  const csv = tableToCsv(tableData);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));

  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
};
