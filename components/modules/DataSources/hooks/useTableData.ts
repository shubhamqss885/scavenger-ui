import { useDatabaseDescription } from "../context/DatabaseDescriptionProvider";

export function useTableData() {
  const { tableData, tableDataLoading, tableDataError, fetchTableData } =
    useDatabaseDescription();

  return {
    data: tableData?.records || [],
    totalRows: tableData?.total_rows || 0,
    totalColumns: tableData?.total_columns || 0,
    pagination: tableData?.pagination,
    latency: tableData?.latency,
    loading: tableDataLoading || false,
    error: tableDataError,
    fetchTableData,
  };
}
