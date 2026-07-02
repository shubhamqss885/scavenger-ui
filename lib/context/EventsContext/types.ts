import type { FileIndexingStage } from "@/lib/services/agenticChatService";

// Base Event Shape
type BaseEvent<T extends string, D> = {
  type: T;
  data: D;
  timestamp?: string;
};

// Payment Domain
export type SubscriptionDeletedData = {
  subscription_id: string;
};

export type SubscriptionUpdatedData = {
  subscription_id: string;
  status: string;
  message: string;
};

export type PaymentEvent =
  | BaseEvent<"subscription_deleted", SubscriptionDeletedData>
  | BaseEvent<"subscription_updated", SubscriptionUpdatedData>;

// OrgDb Status Domain (orgdb_task_status from backend)
export type OrgDbTaskStatusData = {
  orgdb_id: string;
  task_type: "SCHEMA_DESCRIPTION" | "EDA";
  status: "PENDING" | "COMPLETED" | "FAILED";
};

export type OrgDbStatusEvent = BaseEvent<
  "orgdb_task_status",
  OrgDbTaskStatusData
>;

// DataSource Domain (table_names_received from backend)
export type TableNamesReceivedData = {
  orgdb_id: string;
  table_names: string[];
};

export type DataSourceEvent = BaseEvent<
  "table_names_received",
  TableNamesReceivedData
>;

// Ingestion Domain
export type EtlCompletedData = {
  data_source_id: string;
  orgdb_id: string;
};

export type IngestionFailedData = {
  data_source_id: string;
  failed_tasks: string[];
};

export type FileEtlCompletedData = {
  data_source_id: string;
  orgdb_id: string;
  file_name: string;
  table_name: string;
  s3_url: string;
};

export type FileEtlFailedData = {
  data_source_id: string;
  orgdb_id: string;
  file_name: string;
  table_name: string;
  s3_url: string;
  error: string;
};

// schema_description.completed is no longer routed: FE treats data as
// viewable on etl.completed and ignores the later schema-desc event.
export type IngestionEvent =
  | BaseEvent<"etl.completed", EtlCompletedData>
  | BaseEvent<"ingestion.failed", IngestionFailedData>
  | BaseEvent<"file_etl.completed", FileEtlCompletedData>
  | BaseEvent<"file_etl.failed", FileEtlFailedData>;

// File Indexing Domain
export type FileIndexingProgressData = {
  file_id: string;
  project_id: string;
  filename: string;
  progress: number;
  stage: FileIndexingStage;
};

export type FileIndexingEvent = BaseEvent<
  "file.indexing_progress",
  FileIndexingProgressData
>;

// Master Union (for WebSocket routing)
export type AppEvent =
  | PaymentEvent
  | OrgDbStatusEvent
  | DataSourceEvent
  | IngestionEvent
  | FileIndexingEvent;

// Context Value Types
export type PaymentEventsContextValue = {
  events: PaymentEvent[];
  clearEvents: () => Promise<void>;
};

export type OrgDbStatusEventsContextValue = {
  events: OrgDbStatusEvent[];
};

export type DataSourceEventsContextValue = {
  events: DataSourceEvent[];
};

export type IngestionEventsContextValue = {
  events: IngestionEvent[];
};

export type FileIndexingEventsContextValue = {
  events: FileIndexingEvent[];
  seedEvents: (events: FileIndexingEvent[]) => void;
  // NOTE: events are app-wide (not project-scoped); removing one drops it for
  // every consumer. Safe today — only the project route reads this context.
  removeEvent: (fileId: string) => void;
};
