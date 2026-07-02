// Single source of truth for tool metadata (icons, labels, categories).
// Backend names are MCP-prefixed (e.g. mcp__database-tools__execute_sql).
// We extract the last __ segment and do an exact O(1) map lookup.

import type { IconName } from "@/components/ui/icon";

export type ToolCategory =
  | "sql"
  | "chart"
  | "clarification"
  | "vault-read"
  | "vault-write"
  | "file"
  | "text"
  | "hidden"
  | "generic"
  | "web-search";

export type ToolMeta = Readonly<{
  icon: IconName;
  label: string;
  category: ToolCategory;
}>;

const TOOL_META = {
  // Complex renderers
  execute_sql: { icon: "Database", label: "SQL executed", category: "sql" },
  generate_chart: {
    icon: "BarChart3",
    label: "Chart generated",
    category: "chart",
  },
  generate_chart_data: {
    icon: "BarChart3",
    label: "Chart generated",
    category: "chart",
  },
  ask_clarification: {
    icon: "HelpCircle",
    label: "Asked for clarification",
    category: "clarification",
  },

  // Vault reads
  vault_grep: { icon: "Search", label: "Vault Search", category: "vault-read" },
  vault_list: { icon: "List", label: "Vault List", category: "vault-read" },
  vault_glob: {
    icon: "FolderSearch",
    label: "Vault Files",
    category: "vault-read",
  },
  vault_read: { icon: "FileText", label: "Vault Read", category: "vault-read" },
  vault_log: {
    icon: "Activity",
    label: "Vault Health",
    category: "vault-read",
  },
  vault_status: {
    icon: "ClipboardCheck",
    label: "Vault Status",
    category: "vault-read",
  },

  // Vault writes
  vault_write: { icon: "Edit", label: "Vault Write", category: "vault-write" },
  vault_save_rule: {
    icon: "Scale",
    label: "Save Rule",
    category: "vault-write",
  },
  vault_save_golden_query: {
    icon: "Database",
    label: "Save Golden SQL",
    category: "vault-write",
  },
  vault_save_glossary: {
    icon: "BookOpen",
    label: "Save Glossary",
    category: "vault-write",
  },

  // Vault deletes (same category as writes — require approval)
  vault_delete_rule: {
    icon: "Trash2",
    label: "Delete Rule",
    category: "vault-write",
  },
  vault_delete_golden_query: {
    icon: "Trash2",
    label: "Delete Golden Query",
    category: "vault-write",
  },
  vault_delete_file: {
    icon: "Trash2",
    label: "Delete File",
    category: "vault-write",
  },

  // Project file tools (Excel, CSV, PDF, PPTX, DOCX, images)
  list_project_files: {
    icon: "FolderOpen",
    label: "Listed project files",
    category: "file",
  },
  retrieval_rag_tool: {
    icon: "FolderSearch",
    label: "Searched file content",
    category: "file",
  },
  read_project_file: {
    icon: "FileText",
    label: "Read project file",
    category: "file",
  },
  // Knowledge Graph (FalkorDB) tools
  query_schema_graph: {
    icon: "GitBranch",
    label: "Queried knowledge graph",
    category: "generic",
  },
  get_schema_structure: {
    icon: "Share2",
    label: "Retrieved schema structure",
    category: "generic",
  },
  get_table_relationships: {
    icon: "Link",
    label: "Retrieved table relationships",
    category: "generic",
  },
  find_join_path: {
    icon: "GitMerge",
    label: "Found join path",
    category: "generic",
  },
  get_business_rules: {
    icon: "BookOpen",
    label: "Retrieved business rules",
    category: "generic",
  },
  get_sql_examples: {
    icon: "Code",
    label: "Retrieved SQL examples",
    category: "generic",
  },
  update_table_description: {
    icon: "Pencil",
    label: "Updated table description",
    category: "generic",
  },
  update_column_description: {
    icon: "Pencil",
    label: "Updated column description",
    category: "generic",
  },
  update_relationship_description: {
    icon: "Pencil",
    label: "Updated relationship description",
    category: "generic",
  },

  // Generic tools
  inspect_database: {
    icon: "Database",
    label: "Inspected database",
    category: "generic",
  },
  get_schema: {
    icon: "TableProperties",
    label: "Retrieved schema",
    category: "generic",
  },
  list_tables: { icon: "List", label: "Listed tables", category: "generic" },
  get_table_sample: {
    icon: "Table2",
    label: "Sampled table",
    category: "generic",
  },
  get_row_count: { icon: "Hash", label: "Counted rows", category: "generic" },
  search_metadata: {
    icon: "Search",
    label: "Searched metadata",
    category: "generic",
  },
  save_golden_query: {
    icon: "Star",
    label: "Saved golden query",
    category: "generic",
  },
  send_to_slack: {
    icon: "MessageSquare",
    label: "Sent to Slack",
    category: "generic",
  },
  send_to_teams: {
    icon: "MessageSquare",
    label: "Sent to Teams",
    category: "generic",
  },
  web_search: {
    icon: "Globe",
    label: "Web search",
    category: "web-search",
  },
  parse_connection_string: {
    icon: "Link",
    label: "Parsed connection",
    category: "generic",
  },
  request_credentials: {
    icon: "KeyRound",
    label: "Requested credentials",
    category: "generic",
  },
  test_db_connection: {
    icon: "PlugZap",
    label: "Tested connection",
    category: "generic",
  },
  save_connection_script: {
    icon: "Save",
    label: "Saved connection script",
    category: "generic",
  },

  // Pseudo-tools (client-side only, created by useAgenticWebSocket)
  // Icon is a placeholder — "text" category never renders a chip.
  _text: { icon: "Wrench", label: "", category: "text" },

  // Fallback entry for standalone vault_block events when msg.tool is absent
  vault: { icon: "BookLock", label: "Vault", category: "vault-read" },

  // Hidden (internal tools not shown to users)
  // Icon is a placeholder — "hidden" category never renders.
  ToolSearch: { icon: "Wrench", label: "", category: "hidden" },
} as const satisfies Record<string, ToolMeta>;

export type ToolName = keyof typeof TOOL_META;

/** Extract the bare tool name from an MCP-prefixed string. */
export const bareToolName = (toolName: string): string =>
  toolName.split("__").pop() ?? toolName;

export const getToolMeta = (toolName: string): ToolMeta => {
  const key = bareToolName(toolName);

  if (key in TOOL_META) return TOOL_META[key as ToolName];
  // Humanize unknown tools: "some_new_tool" → "Some new tool"
  const humanized = key.replaceAll("_", " ");
  const label = humanized.charAt(0).toUpperCase() + humanized.slice(1);
  return { icon: "Wrench", label, category: "generic" };
};

/** Type-safe exact tool name match (strips MCP prefix automatically). */
export const isToolName = (tool: string, name: ToolName): boolean =>
  bareToolName(tool) === name;

/** Match tool by category (e.g. "chart" matches both generate_chart and generate_chart_data). */
export const isToolCategory = (tool: string, category: ToolCategory): boolean =>
  getToolMeta(tool).category === category;
