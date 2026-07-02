import { AxiosProgressEvent } from "axios";
import { getAxiosInstance } from "@/lib/services/axiosInstances";

export interface CreateDataSourceParams {
  files: File[];
  dataSourceName: string;
  displayName?: string;
  dataSourceType?: "CSV" | "XLSX";
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export interface DataSourceItem {
  data_source_id: string;
  file_name: string;
  table_name: string | null;
}

export interface DataSourceResponse {
  message: string;
  data_sources: DataSourceItem[];
  orgdb_id: string;
}

export interface IngestDataSourceResponse {
  message: string;
  dag_run_id: string;
  ingestion_id?: string; // Keep for backward compatibility
  status?: "INITIATED" | "FAILED";
  estimated_time_seconds?: number;
  error_message?: string;
}

// Data source details response
export interface DataSourceDetails {
  orgdb_id: string;
  data_source_name: string;
  ingestion_status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  target_source_type: "MYSQL" | "POSTGRES" | "SNOWFLAKE";
  created_at: string;
  updated_at: string;
  uploaded_by: string;
}

export interface GetDataSourceResponse {
  data: DataSourceDetails;
  message: string;
}

// ***************
// CSV Profiler Types
// ***************

export interface NumericalColumnStats {
  range?: {
    min: number;
    max: number;
  };
  mean: number;
  median: number;
  standard_deviation: number;
  top_values: Array<{
    value: number;
    count: number;
  }>;
  outlier_pct: number;
  outlier_count: number;
  null_pct: number;
  null_count: number;
  unique_pct: number;
  unique_count: number;
}

export interface CategoricalColumnStats {
  top_5_values_coverage_pct: number;
  top_5_values?: Array<{
    value: string;
    count: number;
  }>;
  null_count: number;
  unique_count: number;
  null_pct: number;
  unique_pct: number;
  max_length: number;
}

export interface DatetimeColumnStats {
  range?: {
    min: string;
    max: string;
  };
  null_count: number;
  unique_count: number;
  null_pct: number;
  unique_pct: number;
}

export interface DataQualityAlert {
  code:
    | "MIXED_TYPE_COLUMN"
    | "SEPARATOR_CURRENCY_DETECTED"
    | "TRAILING_WHITESPACE"
    | "ZERO_VARIANCE"
    | "HIGH_MISSING_DATA"
    | "HIGH_OUTLIER_PERCENTAGE"
    | "DUPLICATE_ROWS"
    | "HIGH_NULL_COLUMNS"
    | "CONSTANT_COLUMNS";
  column?: string[];
  details?: {
    // Numeric metrics
    count?: number;
    pct?: number;

    // Mixed types
    parsable_numeric_pct?: number;
    invalid_examples?: string[];

    // Currency/separators
    patterns?: Array<{
      example: string;
      thousands?: string | null;
      decimal?: string | null;
      currency?: string | null;
    }>;

    // Zero variance
    unique_value?: string;
  };
}

export interface CSVProfileResponse {
  meta: {
    file_name: string;
    generated_at: string;
    total_rows: number;
    preview_row_count: number;
    columns: number;
    file_size_mb: number;
  };
  preview: {
    columns: string[];
    rows: Array<Record<string, any>>;
  };
  allRows?: Array<Record<string, any>>;
  table_stats: {
    quality_score: number;
    total_missing_pct: number;
    outlier_rows_pct: number;
    duplicate_rows_pct: number;
    correlation: {
      method: string;
      top_pairs: Array<{
        column_x: string;
        column_y: string;
        coefficient: number;
      }>;
    };
  };
  columns_by_type: {
    numerical?: Record<string, NumericalColumnStats>;
    categorical?: Record<string, CategoricalColumnStats>;
    datetime?: Record<string, DatetimeColumnStats>;
  };
  alerts: Array<DataQualityAlert>;
}

// Response when profile is rejected (e.g., table exceeds row threshold)
export interface RejectedProfileResponse {
  status: "rejected";
  message: string;
  total_rows: number;
  threshold: number;
}

// Union type for profile data responses
export type ProfileDataResponse = CSVProfileResponse | RejectedProfileResponse;

// Type guard to check if response is a rejected profile
export function isRejectedProfile(
  data: ProfileDataResponse,
): data is RejectedProfileResponse {
  return "status" in data && data.status === "rejected";
}

// API response wrapper from backend
interface CSVProfileAPIResponse {
  message: string;
  data: ProfileDataResponse;
}

// ***************
// APIs start here
// ***************

export const createDataSource = async ({
  files,
  dataSourceName,
  displayName,
  dataSourceType = "CSV",
  onUploadProgress,
}: CreateDataSourceParams): Promise<DataSourceResponse> => {
  const formData = new FormData();
  formData.append("data_source_name", dataSourceName);
  if (displayName) formData.append("display_name", displayName);
  formData.append("data_source_type", dataSourceType);
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("target_source_type", "MYSQL");

  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.post<DataSourceResponse>(
    "/external-data/create_data_source",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    },
  );

  return response.data;
};

export const ingestDataSource = async (
  dataSourceId: string,
  tableName?: string,
): Promise<IngestDataSourceResponse> => {
  const formData = new FormData();
  formData.append("data_source_id", dataSourceId);
  if (tableName) formData.append("table_name", tableName);

  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.post<IngestDataSourceResponse>(
    "/external-data/ingest_data_source",
    formData,
  );

  return response.data;
};

export const getDataSource = async (
  dataSourceId: string,
): Promise<GetDataSourceResponse> => {
  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.get<GetDataSourceResponse>(
    `/external-data/get_data_source/${dataSourceId}`,
  );

  return response.data;
};

// POST - Generate new profile data
// For CSV uploads: only orgDbId is needed
// For DB connections: tableName is required (backend returns 400 without it)
export const generateCSVProfileData = async (
  orgDbId: string,
  tableName?: string,
): Promise<ProfileDataResponse> => {
  const axiosInstance = getAxiosInstance();

  const payload: { orgdb_id: string; table_name?: string } = {
    orgdb_id: orgDbId,
  };

  if (tableName) {
    payload.table_name = tableName;
  }

  const response = await axiosInstance.post<CSVProfileAPIResponse>(
    "/external-data/profile_data",
    payload,
  );
  return response.data.data;
};

// GET - Retrieve stored profile data
export const getStoredCSVProfileData = async (
  orgDbId: string,
): Promise<ProfileDataResponse> => {
  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.get<CSVProfileAPIResponse>(
    `/external-data/profile_data/${orgDbId}`,
  );
  return response.data.data;
};

// Function to get datasource schema details including file size
