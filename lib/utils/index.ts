import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomErrorParams {
  message: string;
  [key: string]: any;
}

export class CustomError<
  T extends CustomErrorParams = CustomErrorParams,
> extends Error {
  public details: T;

  constructor(params: T) {
    if (!params || typeof params.message !== "string") {
      throw new Error(
        'Invalid parameters. Object with a "message" property is required.',
      );
    }

    super(params.message);

    this.name = "CustomError";

    this.details = params;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export interface EmptyStates {
  isChatEmpty: boolean;
  isDashboardEmpty: boolean;
}

export interface screenSplit {
  toggleStatus: string;
  forSplit: boolean;
}

export interface screenSplit {
  toggleStatus: string;
  forSplit: boolean;
}

export interface FileType {
  uploadProgress: number;
  fileId?: string;
}

export interface EditProject {
  project_name: string;
  project_id: string;
}

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "";

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY must be set in environment variables");
}

export function encrypt(text: string): string {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  const concatenated = salt.concat(iv).concat(encrypted.ciphertext);
  return concatenated.toString(CryptoJS.enc.Base64);
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ""; // Handle empty encrypted values
  const combined = CryptoJS.enc.Base64.parse(encryptedText);

  // const startTime = performance.now();
  // console.log("decrypt start", startTime);
  // Extract salt, iv, and encrypted text
  const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
  const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8));
  const encrypted = CryptoJS.lib.WordArray.create(combined.words.slice(8));

  // Derive the key using PBKDF2
  const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: encrypted,
    }),
    key,
    {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    },
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}

// Parse database connection URL into components
export type ParsedConnectionUrl = {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  schema: string;
};

export function parseConnectionUrl(connectionUrl: string): ParsedConnectionUrl {
  const result: ParsedConnectionUrl = {
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
    schema: "",
  };

  if (!connectionUrl) return result;

  try {
    // Handle MSSQL format: mssql+pyodbc://user:pass@host/db?driver=...
    // Handle PostgreSQL format: postgresql://user:pass@host:port/db
    // Handle MySQL format: mysql://user:pass@host:port/db

    // Remove the protocol prefix to get the rest
    const protocolMatch = connectionUrl.match(/^([^:]+):\/\/(.+)$/);

    if (!protocolMatch) return result;

    const rest = protocolMatch[2];

    // Split by @ to separate credentials from host
    const atIndex = rest.lastIndexOf("@");

    if (atIndex === -1) return result;

    const credentials = rest.substring(0, atIndex);
    const hostAndPath = rest.substring(atIndex + 1);

    // Parse credentials (user:pass)
    const colonIndex = credentials.indexOf(":");

    if (colonIndex !== -1) {
      result.username = decodeURIComponent(
        credentials.substring(0, colonIndex),
      );
      result.password = decodeURIComponent(
        credentials.substring(colonIndex + 1),
      );
    } else {
      result.username = decodeURIComponent(credentials);
    }

    // Parse host/port/database - split by / first
    const pathIndex = hostAndPath.indexOf("/");
    const hostPort =
      pathIndex !== -1 ? hostAndPath.substring(0, pathIndex) : hostAndPath;
    const pathAndQuery =
      pathIndex !== -1 ? hostAndPath.substring(pathIndex + 1) : "";

    // Parse host:port
    const portMatch = hostPort.match(/^(.+):(\d+)$/);

    if (portMatch) {
      result.host = portMatch[1];
      result.port = portMatch[2];
    } else {
      result.host = hostPort;
    }

    // Parse database name (before query string)
    if (pathAndQuery) {
      const queryIndex = pathAndQuery.indexOf("?");
      result.database =
        queryIndex !== -1
          ? pathAndQuery.substring(0, queryIndex)
          : pathAndQuery;

      // Parse schema from query string if present
      if (queryIndex !== -1) {
        const queryString = pathAndQuery.substring(queryIndex + 1);
        const params = new URLSearchParams(queryString);
        result.schema =
          params.get("schema") || params.get("currentSchema") || "";
      }
    }
  } catch {
    console.error("Failed to parse connection URL");
  }

  return result;
}

// OS Detection & Shortcut Formatting
const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.toUpperCase().includes("MAC");
};

export const formatSingleKey = (key: string, forMac?: boolean): string => {
  const useMac = forMac ?? isMac();

  // Key mapping for better display
  const keyMap = useMac
    ? {
        mod: "⌘",
        alt: "⌥",
        shift: "Shift",
        ctrl: "⌃",
        slash: "/",
        enter: "↵",
        space: "Space",
        tab: "⇥",
        backspace: "⌫",
        delete: "⌦",
        escape: "⎋",
        up: "↑",
        down: "↓",
        left: "←",
        right: "→",
      }
    : {
        mod: "Ctrl",
        alt: "Alt",
        shift: "Shift",
        ctrl: "Ctrl",
        slash: "/",
        enter: "Enter",
        space: "Space",
        tab: "Tab",
        backspace: "Backspace",
        delete: "Delete",
        escape: "Esc",
        up: "↑",
        down: "↓",
        left: "←",
        right: "→",
      };

  return keyMap[key.toLowerCase() as keyof typeof keyMap] || key.toUpperCase();
};

export const getOSName = (): "mac" | "windows" | "unknown" => {
  if (typeof navigator === "undefined") return "unknown";
  const userAgent = navigator.userAgent.toUpperCase();

  if (userAgent.includes("MAC")) return "mac";
  if (userAgent.includes("WIN")) return "windows";
  return "unknown";
};

/**
 * Detects if a hostname belongs to a production cluster that should have masked credentials.
 * Matches patterns like:
 * - production.cluster-xxx.region.rds.amazonaws.com
 * - scavenger-mssql-production.xxx.region.rds.amazonaws.com
 * - any hostname containing "production" and ending with .rds.amazonaws.com
 */
export function isProductionDatabase(
  hostname: string | null | undefined,
): boolean {
  if (!hostname) return false;
  const lowerHost = hostname.toLowerCase();
  return (
    lowerHost.includes("production") && lowerHost.endsWith(".rds.amazonaws.com")
  );
}

/**
 * Masks a hostname by showing only the first part and hiding the rest.
 * e.g., "production.cluster-xxx.eu-central-1.rds.amazonaws.com" → "production.****"
 */
export function maskHostname(hostname: string): string {
  const firstDot = hostname.indexOf(".");

  if (firstDot === -1) return "****";
  return hostname.substring(0, firstDot) + ".****";
}

/**
 * Masks a username by showing only the first 2 characters.
 * e.g., "admin_user" → "ad****"
 */
export function maskUsername(username: string): string {
  if (username.length <= 2) return "****";
  return username.substring(0, 2) + "****";
}

/**
 * Formats numeric values according to scientific notation display norms:
 * - Values < 0.0001 (1e-4): Exponential format (e.g., 9.11e-31, 1e-9)
 * - Values 0.0001 to 10,000,000: Decimal format (e.g., 0.005, 123000)
 * - Values > 10,000,000 (1e7): Exponential format (e.g., 1e+10, 6.02e+23)
 *
 * @param value - The value to format (can be string, number, or any type)
 * @returns Formatted string representation of the value
 */
export function formatScientificNotation(value: any): string {
  // If value is null or undefined, return as-is
  if (value === null || value === undefined) {
    return String(value);
  }

  // If value is an empty string, return empty string (don't convert to 0)
  if (typeof value === "string" && value.trim() === "") {
    return value;
  }

  // Try to parse as number
  const num = typeof value === "number" ? value : Number(value);

  // If it's not a valid number, return the original value as string
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return String(value);
  }

  // Handle zero specially
  if (num === 0) {
    return "0";
  }

  const absNum = Math.abs(num);

  // Very small numbers: < 0.0001 (1e-4) → exponential
  if (absNum < 0.0001) {
    return num.toExponential();
  }

  // Very large numbers: > 10,000,000 (1e7) → exponential
  if (absNum > 10000000) {
    return num.toExponential();
  }

  // Medium range: 0.0001 to 10,000,000 → decimal
  // Use regular number display without scientific notation
  return String(num);
}
