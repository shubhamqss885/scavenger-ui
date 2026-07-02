import type { KGGraphStructure } from "@/lib/services/agenticChatService";

export type KgSubTab =
  | "graph"
  | "tables"
  | "columns"
  | "relationships"
  | "views";

export type TableItem = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  rowCount: number | null;
  tableType: string | null;
  columnCount: number;
  aliases: string[] | null;
};

export type ColumnItem = {
  id: string;
  tableName: string;
  name: string;
  dataType: string;
  description: string | null;
  isPk: boolean;
  nullable: boolean | null;
  confidence: number;
  uniqueValues: number | null;
  minValue: string | null;
  maxValue: string | null;
  aliases: string[] | null;
};

export type RelationshipItem = {
  id: string;
  name: string | null;
  description: string | null;
  businessMeaning: string | null;
  certified: boolean | null;
  cardinality: string | null;
  leftTable: string;
  rightTable: string;
  leftTableDisplay: string;
  rightTableDisplay: string;
  columnPairs: { left: string; right: string }[];
  label: string;
};

export type ViewItem = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  rowCount: number | null;
  aliases: string[] | null;
};

export type TransformedKgData = {
  tables: TableItem[];
  columns: ColumnItem[];
  relationships: RelationshipItem[];
  views: ViewItem[];
};

/** Format table name for display: snake_case -> Title Case */
export const formatTableName = (name: string): string => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/** Transform API structure into tabular data */
export const transformToTabularData = (
  structure: KGGraphStructure,
): TransformedKgData => {
  // Count columns per table
  const columnCounts: Record<string, number> = {};

  if (structure.edges.Table_OUT?.HAS_COLUMN) {
    for (const [tableName, columns] of Object.entries(
      structure.edges.Table_OUT.HAS_COLUMN,
    )) {
      columnCounts[tableName] = columns.length;
    }
  }

  // Tables
  const tables: TableItem[] = Object.entries(structure.nodes.Table).map(
    ([id, data]) => ({
      id,
      name: id,
      displayName: formatTableName(id),
      description: data.description || null,
      rowCount: data.row_count,
      tableType: data.table_type,
      columnCount: columnCounts[id] || 0,
      aliases: data.aliases,
    }),
  );

  // Columns
  const columns: ColumnItem[] = Object.entries(structure.nodes.Column).map(
    ([id, data]) => {
      const tableName = id.split(".")[0];
      return {
        id,
        tableName,
        name: data.name,
        dataType: data.data_type,
        description: data.description || null,
        isPk: data.is_pk,
        nullable: data.nullable,
        confidence: data.column_confidence,
        uniqueValues: data.unique_values,
        minValue: data.min_value,
        maxValue: data.max_value,
        aliases: data.aliases,
      };
    },
  );

  // Relationships - merge edge data with node semantic data
  const relationshipNodes = structure.nodes.Relationship || {};
  const relationships: RelationshipItem[] = Object.entries(
    structure.edges.Relation_OUT || {},
  ).map(([id, rel]) => {
    const nodeData = relationshipNodes[id];
    return {
      id,
      name: nodeData?.name || null,
      description: nodeData?.description || null,
      businessMeaning: nodeData?.business_meaning || null,
      certified: nodeData?.certified ?? null,
      cardinality: nodeData?.cardinality || null,
      leftTable: rel.LEFT_TABLE,
      rightTable: rel.RIGHT_TABLE,
      leftTableDisplay: formatTableName(rel.LEFT_TABLE),
      rightTableDisplay: formatTableName(rel.RIGHT_TABLE),
      columnPairs: rel.COLS.map(([left, right]) => ({
        left: left.split(".")[1] || left,
        right: right.split(".")[1] || right,
      })),
      label: rel.COLS.map(
        ([left, right]) =>
          `${left.split(".")[1] || left} → ${right.split(".")[1] || right}`,
      ).join(", "),
    };
  });

  // Views
  const views: ViewItem[] = structure.nodes.View
    ? Object.entries(structure.nodes.View).map(([id, data]) => ({
        id,
        name: id,
        displayName: formatTableName(id),
        description: data.description || null,
        rowCount: data.row_count,
        aliases: data.aliases,
      }))
    : [];

  return { tables, columns, relationships, views };
};
