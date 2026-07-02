export type {
  Connector,
  ConnectorCategory,
  ConnectorId,
  FieldConfig,
  FieldRow,
} from "./types";

export { flattenFields, maskConnectionString } from "./shared";

import { relationalConnectors } from "./relational";
import { cloudConnectors } from "./cloud";
import { analyticsConnectors } from "./analytics";
import { nosqlConnectors } from "./nosql";
import { specialtyConnectors } from "./specialty";
import { filesConnectors } from "./files";
import { biConnectors } from "./bi";
import type { Connector } from "./types";

export const CONNECTORS: Connector[] = [
  ...relationalConnectors,
  ...cloudConnectors,
  ...nosqlConnectors,
  ...analyticsConnectors,
  ...specialtyConnectors,
  ...filesConnectors,
  ...biConnectors,
];
