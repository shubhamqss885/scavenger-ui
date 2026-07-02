import {
  DatabaseTable,
  OrganizationDb,
  SchemaDescriptionStatus,
  TableDataResponse,
} from "@/lib/services/organizationDbService";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";

export interface Database extends Partial<OrganizationDb> {
  id: OrganizationDb["orgdb_id"];
  name: OrganizationDb["orgdb_name_decrypted"];
  host: OrganizationDb["orgdb_hostname_decrypted"];
  tables: DatabaseTable[];
  schema_description_status?: SchemaDescriptionStatus;
}

export type BatchProfileStatus =
  | "pending"
  | "running"
  | "done"
  | "error"
  | "skipped";

export interface BatchTableStatus {
  status: BatchProfileStatus;
  errorMessage?: string;
}

export interface IDatabaseDescriptionState {
  database: Database | null;
  loading: boolean;
  error: string | null;
  listTablesError?: boolean;
  tableData?: TableDataResponse | null;
  tableDataLoading?: boolean;
  tableDataError?: string | null;
  csvProfile?: CSVProfileResponse | null;
  csvProfileLoading?: boolean;
  csvProfileError?: string | null;
  // Multi-table profiling support (for connected DBs)
  tableProfiles: Record<string, CSVProfileResponse>;
  tableProfileError?: string | null;
  selectedProfileTable?: string;
  tableProfileGenerating?: string | null;
  // Batch profiling — per-table status for Generate All flow
  batchProfileStatus: Record<string, BatchTableStatus>;
  isBatchProfiling: boolean;
}
