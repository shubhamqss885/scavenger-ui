"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTableData } from "@/components/modules/DataSources/hooks/useTableData";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { TableDataViewer } from "./components/TableDataViewer";
import { TableSelector } from "./components/TableSelector";
import { TablePagination } from "./components/TablePagination";
import { TableFilters } from "./components/TableFilters";
import { TableSkeleton } from "./components/TableSkeleton";
import { EmptyState } from "./components/EmptyState";
import { DataLoadingSkeleton } from "./components/DataLoadingSkeleton";
import { useTranslation } from "react-i18next";
import {
  useDatabaseStatus,
  UNIFIED_DB_STATUS,
} from "@/lib/hooks/useDatabaseStatus";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";

export const DataSourceDataModule = () => {
  const { t } = useTranslation("database");
  const { data, loading, error, fetchTableData, totalRows, pagination } =
    useTableData();
  const {
    database,
    databaseId,
    loading: contextLoading,
    listTablesError,
  } = useDatabaseDescription();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const canViewTableFilters = isFeatureEnabled(
    FEATURE_FLAGS.VIEW_TABLE_FILTERS,
  );
  const { status } = useDatabaseStatus(databaseId);
  const { getDbById } = useOrganizationDbData();
  const hasDataSource = getDbById(databaseId)?.has_data_source === true;

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleTableSelect = useCallback(
    async (tableName: string) => {
      setSelectedTable(tableName);
      setCurrentPage(1);
      setFilters({});
      if (tableName) {
        await fetchTableData({
          table_name: tableName,
          page: 1,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          filters: {},
        });
      }
    },
    [fetchTableData, pageSize, sortBy, sortOrder],
  );

  // Auto-select first table when database loads
  useEffect(() => {
    if (
      database?.tables?.length &&
      database.tables.length > 0 &&
      !selectedTable &&
      !contextLoading
    ) {
      const selectFirstTable = async () => {
        try {
          const sortedTables = [...database.tables].sort((a, b) =>
            a.table_name.localeCompare(b.table_name),
          );
          const firstTable = sortedTables[0].table_name;
          await handleTableSelect(firstTable);
        } catch (error) {
          console.error("Failed to auto-select table:", error);
        }
      };

      selectFirstTable();
    }
  }, [database, selectedTable, contextLoading, handleTableSelect]);

  // Reset selection when tables are cleared (during refresh)
  useEffect(() => {
    if (database?.tables?.length === 0 && selectedTable) {
      setSelectedTable("");
    }
  }, [database?.tables?.length, selectedTable]);

  const handlePageChange = useCallback(
    async (page: number) => {
      setCurrentPage(page);
      if (selectedTable) {
        await fetchTableData({
          table_name: selectedTable,
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          filters,
        });
      }
    },
    [fetchTableData, selectedTable, pageSize, sortBy, sortOrder, filters],
  );

  const handlePageSizeChange = useCallback(
    async (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1);
      if (selectedTable) {
        await fetchTableData({
          table_name: selectedTable,
          page: 1,
          page_size: newPageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          filters,
        });
      }
    },
    [fetchTableData, selectedTable, sortBy, sortOrder, filters],
  );

  const handleSort = useCallback(
    async (column: string, order: "asc" | "desc") => {
      setSortBy(column);
      setSortOrder(order);
      if (selectedTable) {
        await fetchTableData({
          table_name: selectedTable,
          page: currentPage,
          page_size: pageSize,
          sort_by: column,
          sort_order: order,
          filters,
        });
      }
    },
    [fetchTableData, selectedTable, currentPage, pageSize, filters],
  );

  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const applyFilters = useCallback(
    async (newFilters?: Record<string, any>) => {
      // Use provided filters or fall back to state filters
      const filtersToApply = newFilters ?? filters;
      setCurrentPage(1);
      if (selectedTable) {
        await fetchTableData({
          table_name: selectedTable,
          page: 1,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          filters: filtersToApply,
        });
      }
    },
    [fetchTableData, selectedTable, pageSize, sortBy, sortOrder, filters],
  );

  const resetFilters = useCallback(async () => {
    setFilters({});
    setCurrentPage(1);
    if (selectedTable) {
      await fetchTableData({
        table_name: selectedTable,
        page: 1,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        filters: {},
      });
    }
  }, [fetchTableData, selectedTable, pageSize, sortBy, sortOrder]);

  // Derive columns from schema (not data) to ensure filters work even with empty results
  const columns = useMemo(() => {
    // Priority 1: Get from table schema (authoritative source)
    if (selectedTable && database?.tables) {
      const tableInfo = database.tables.find(
        (t) => t.table_name === selectedTable,
      );

      if (tableInfo?.table_columns?.length) {
        return tableInfo.table_columns
          .map((col) => col.column_name)
          .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
      }
    }

    // Priority 2: Fallback to data columns (for edge cases)
    if (data.length > 0) {
      return Object.keys(data[0]).sort((a, b) => a.localeCompare(b)); // Sort alphabetically
    }

    // Priority 3: Empty array (no table selected or schema not loaded)
    return [];
  }, [selectedTable, database?.tables, data]);

  // Get column count - reuses the columns array defined above
  const getColumnCount = () => {
    return columns.length || 11; // Default to 11 for skeleton rendering
  };

  if (contextLoading) {
    return (
      <DataLoadingSkeleton
        rows={40}
        columns={getColumnCount()}
        pageSize={pageSize}
      />
    );
  }

  const renderMainContent = () => {
    // Status-based gating only applies to file-based ingest (CSV/Excel/Sheets).
    // SQL connectors come in ready and don't go through the ingest pipeline that drives status.
    if (hasDataSource) {
      if (status === UNIFIED_DB_STATUS.NOT_STARTED) {
        return <EmptyState type="setup-required" />;
      }
      if (status === UNIFIED_DB_STATUS.IN_PROGRESS) {
        return <EmptyState type="processing" />;
      }
      if (status === UNIFIED_DB_STATUS.FAILED) {
        return <EmptyState type="setup-failed" />;
      }
    }

    if (error) {
      return (
        <EmptyState
          type="error"
          message={error}
          onAction={() => {
            if (selectedTable) {
              fetchTableData({
                table_name: selectedTable,
                page: currentPage,
                page_size: pageSize,
                sort_by: sortBy,
                sort_order: sortOrder,
                filters,
              });
            }
          }}
          actionLabel={t("dataTab.actions.retry")}
        />
      );
    }

    if (loading) {
      return (
        <TableSkeleton
          rows={Math.min(pageSize, 40)}
          columns={getColumnCount()}
        />
      );
    }

    if (!selectedTable) {
      // If list_tables API failed, show error state
      if (listTablesError) {
        return <EmptyState type="error" />;
      }
      // No tables available (empty list returned)
      if (database?.tables?.length === 0) {
        return <EmptyState type="no-table" />;
      }
      return <EmptyState type="no-table" />;
    }

    if (data.length === 0) {
      const hasFilters = Object.keys(filters).length > 0;
      return (
        <EmptyState
          type={hasFilters ? "no-results" : "no-data"}
          message={
            hasFilters ? t("dataTab.emptyStates.noResultsFoundDesc") : undefined
          }
          onAction={hasFilters ? resetFilters : undefined}
          actionLabel={
            hasFilters ? t("dataTab.actions.resetFilters") : undefined
          }
        />
      );
    }

    return (
      <TableDataViewer
        data={data}
        loading={loading}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    );
  };

  return (
    <div className="flex h-0 min-h-full flex-col">
      {/* Header */}
      <div className="border-b py-[7.5px]">
        <div className="flex items-center gap-3 px-4 sm:px-6">
          {/* Table Selector */}
          <TableSelector
            value={selectedTable}
            onValueChange={handleTableSelect}
            disabled={loading}
          />

          {selectedTable && canViewTableFilters && (
            <TableFilters
              columns={columns}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
          )}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="w-full flex-1 overflow-auto">{renderMainContent()}</div>

      {/* Footer with Pagination - Fixed at bottom */}
      {selectedTable && !error && (
        <div className="border-t">
          <TablePagination
            pagination={pagination}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
            showSkeleton={loading || data.length === 0}
          />
        </div>
      )}
    </div>
  );
};
