import {
  DatabaseTable,
  DatabaseColumn,
} from "@/lib/services/organizationDbService";

/**
 * Custom error class for ERD generation errors
 */
export class ERDGenerationError extends Error {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ERDGenerationError";
  }
}

// Formats column type for Mermaid ER diagram compatibility.
function formatColumnType(sqlType: string): string {
  if (!sqlType) {
    return "unknown";
  }

  let formatted = sqlType;

  // For enum and set types, extract just the base type (remove values)
  // e.g., "enum('not_started','queued','running')" -> "enum"
  if (/^(enum|set)\s*\(/i.test(formatted)) {
    formatted = formatted.replace(/^(enum|set)\s*\(.*\)$/i, "$1");
  }

  formatted = formatted
    // Remove single quotes (can cause Mermaid parse errors)
    .replaceAll("'", "")
    // Replace spaces with underscores (e.g., "TIMESTAMP WITH TIME ZONE" -> "TIMESTAMP_WITH_TIME_ZONE")
    .replaceAll(/\s+/g, "_")
    // Replace commas with underscores (e.g., "decimal(5,2)" -> "decimal(5_2)")
    .replaceAll(",", "_");

  // If it starts with a number, prefix with 'type_'
  if (/^\d/.test(formatted)) {
    formatted = `type_${formatted}`;
  }

  return formatted || "unknown";
}

/**
 * Escapes special characters in table/column names for Mermaid
 */
function escapeName(name: string): string {
  if (!name) {
    throw new ERDGenerationError("Invalid name: Name cannot be empty");
  }

  // Replace dots and other special characters with underscores
  let escaped = name.replace(/\W/g, "_");

  // If it starts with a number, prefix with 'col_' (Mermaid requirement)
  if (/^\d/.test(escaped)) {
    escaped = `col_${escaped}`;
  }

  return escaped;
}

/**
 * Determines if a column is a primary key
 */
function isPrimaryKey(column: DatabaseColumn): boolean {
  // Only use explicit metadata from database
  return column.is_primary_key === true;
}

/**
 * Determines if a column is a foreign key
 */
function isForeignKey(column: DatabaseColumn): boolean {
  // Only use explicit metadata from database
  return column.is_foreign_key === true;
}

/**
 * Generates Mermaid ER diagram syntax from database tables
 * @throws {ERDGenerationError} When tables data is invalid or generation fails
 */
export function generateERDiagram(tables: DatabaseTable[]): string {
  try {
    // Validate input
    if (!tables || !Array.isArray(tables)) {
      throw new ERDGenerationError("Invalid input: tables must be an array");
    }

    if (tables.length === 0) {
      throw new ERDGenerationError("No tables found in the database schema");
    }

    // Check for critical data issues
    const invalidTables = tables.filter(
      (t) => !t.table_name || !t.table_columns,
    );

    if (invalidTables.length > 0) {
      throw new ERDGenerationError(
        `Invalid table data: ${invalidTables.length} table(s) missing required fields`,
        { invalidTables: invalidTables.map((t) => t.table_name || "unnamed") },
      );
    }

    let diagram = "---\nconfig:\n  layout: elk\n---\nerDiagram\n";

    // Sort tables by relationships - tables without foreign keys first
    const sortedTables = [...tables].sort((a, b) => {
      const aHasForeignKeys = a.table_columns.some((col) => isForeignKey(col));
      const bHasForeignKeys = b.table_columns.some((col) => isForeignKey(col));

      if (!aHasForeignKeys && bHasForeignKeys) return -1;
      if (aHasForeignKeys && !bHasForeignKeys) return 1;
      return 0;
    });

    // Generate table definitions with square bracket syntax
    sortedTables.forEach((table) => {
      try {
        const tableName = escapeName(table.table_name).toUpperCase();
        diagram += `  ${tableName}["${tableName}"] {\n`;

        // Handle empty tables
        if (!table.table_columns || table.table_columns.length === 0) {
          diagram += "    string placeholder\n"; // Add placeholder for empty tables
          diagram += "  }\n";
          return;
        }

        // Sort columns: PKs first, then FKs, then regular columns
        const sortedColumns = [...table.table_columns].sort((a, b) => {
          const aIsPK = isPrimaryKey(a);
          const bIsPK = isPrimaryKey(b);
          const aIsFK = isForeignKey(a);
          const bIsFK = isForeignKey(b);

          if (aIsPK && !bIsPK) return -1;
          if (!aIsPK && bIsPK) return 1;
          if (aIsFK && !bIsFK) return -1;
          if (!aIsFK && bIsFK) return 1;
          return 0;
        });

        // Add columns
        sortedColumns.forEach((column) => {
          if (!column.column_name) {
            console.warn(
              `Skipping column with missing name in table ${table.table_name}`,
            );
            return;
          }

          const columnName = escapeName(column.column_name);
          const columnType = formatColumnType(column.column_type);
          const isPK = isPrimaryKey(column);
          const isFK = isForeignKey(column);

          let indicator = "";
          if (isPK) {
            indicator = " PK";
          } else if (isFK) {
            indicator = " FK";
          }

          diagram += `    ${columnType} ${columnName}${indicator}\n`;
        });

        diagram += "  }\n";
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new ERDGenerationError(
          `Failed to process table "${table.table_name}": ${errorMessage}`,
          { table: table.table_name, originalError: error },
        );
      }
    });

    // Add relationships (with error handling)
    try {
      const relationships = inferRelationships(tables);
      relationships.forEach((rel) => {
        diagram += `  ${rel}\n`;
      });
    } catch (error: unknown) {
      // Log warning but don't fail the entire diagram
      console.warn("Failed to infer some relationships:", error);
    }

    return diagram;
  } catch (error: unknown) {
    if (error instanceof ERDGenerationError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new ERDGenerationError(
      `Unexpected error generating ER diagram: ${errorMessage}`,
      { originalError: error },
    );
  }
}

/**
 * Creates relationships based on explicit foreign key metadata only
 */
function inferRelationships(tables: DatabaseTable[]): string[] {
  try {
    const relationships: string[] = [];

    tables.forEach((table) => {
      if (!table.table_columns || !Array.isArray(table.table_columns)) {
        return; // Skip tables without columns
      }

      table.table_columns.forEach((column) => {
        try {
          // Only use explicit foreign key metadata from database
          if (column.is_foreign_key === true && column.foreign_key_table) {
            const fromTable = escapeName(table.table_name).toUpperCase();
            const toTable = escapeName(column.foreign_key_table).toUpperCase();
            const relationName = column.column_name || "relates_to";
            relationships.push(
              `${toTable} ||--o{ ${fromTable} : ${relationName}`,
            );
          }
        } catch (error: unknown) {
          // Log but don't fail for individual column processing
          console.warn(
            `Failed to process relationship for column ${column.column_name}:`,
            error,
          );
        }
      });
    });

    // Remove duplicate relationships
    return Array.from(new Set(relationships));
  } catch (error: unknown) {
    console.warn("Error creating relationships:", error);
    return []; // Return empty array on error rather than failing
  }
}
