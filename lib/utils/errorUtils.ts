// Regex pattern to detect SQLAlchemy/PyMySQL errors
const SQLALCHEMY_ERROR_PATTERN =
  /pymysql\.err\.|sqlalchemy|OperationalError|InterfaceError|ProgrammingError/i;

// Pattern to extract MySQL error codes like (2003, or (1045,
const MYSQL_ERROR_CODE_PATTERN = /\((\d{4}),/;

// Pattern to extract errno like [Errno 101]
const ERRNO_PATTERN = /\[Errno (\d+)\]/;

// Pattern to detect timeout errors
const TIMEOUT_PATTERN = /timeout|timed out/i;

// Map of MySQL error codes to i18n keys
const MYSQL_ERROR_CODE_MAP: Record<string, string> = {
  "2003": "connectionErrors.2003", // Can't connect to server
  "2005": "connectionErrors.2005", // Unknown host
  "2006": "connectionErrors.2006", // Server gone away
  "1045": "connectionErrors.1045", // Access denied (auth failed)
  "1049": "connectionErrors.1049", // Unknown database
  "1044": "connectionErrors.1044", // Access denied to database
};

// Map of system errno to i18n keys
const ERRNO_MAP: Record<string, string> = {
  "101": "connectionErrors.errno101", // Network unreachable
  "111": "connectionErrors.errno111", // Connection refused
  "110": "connectionErrors.timeout", // Connection timed out
  "113": "connectionErrors.errno101", // No route to host
};

// Checks if an error detail string contains SQLAlchemy/PyMySQL error patterns.
function isDatabaseConnectionError(detail: string): boolean {
  if (!detail || typeof detail !== "string") {
    return false;
  }
  return SQLALCHEMY_ERROR_PATTERN.test(detail);
}

// Parses the error detail string to extract the error code.
function parseDbErrorCode(detail: string): string | null {
  if (!detail || typeof detail !== "string") {
    return null;
  }

  // Try to match MySQL error code (e.g., 2003, 1045)
  const mysqlMatch = MYSQL_ERROR_CODE_PATTERN.exec(detail);

  if (mysqlMatch?.[1] && MYSQL_ERROR_CODE_MAP[mysqlMatch[1]]) {
    return MYSQL_ERROR_CODE_MAP[mysqlMatch[1]];
  }

  // Try to match system errno (e.g., [Errno 101])
  const errnoMatch = ERRNO_PATTERN.exec(detail);

  if (errnoMatch?.[1] && ERRNO_MAP[errnoMatch[1]]) {
    return ERRNO_MAP[errnoMatch[1]];
  }

  // Check for timeout patterns
  if (TIMEOUT_PATTERN.test(detail)) {
    return "connectionErrors.timeout";
  }

  // Return default key for unknown database errors
  return "connectionErrors.default";
}

// Gets a user-friendly error message for database connection errors.
function getDbErrorMessage(detail: string, t: (key: string) => string): string {
  const errorKey = parseDbErrorCode(detail);

  if (errorKey) {
    const message = t(errorKey);

    // If translation returns the key itself, it means the key doesn't exist
    if (message && message !== errorKey) {
      return message;
    }
  }

  // Fallback to default message
  return t("connectionErrors.default");
}

// Handles database operation errors with smart detection.
export function handleDbOperationError(
  error: unknown,
  fallbackKey: string,
  t: (key: string) => string,
  toast: { error: (message: string) => void },
  isAxiosError: (error: unknown) => boolean,
): void {
  if (isAxiosError(error)) {
    const axiosErr = error as { response?: { data?: { detail?: string } } };
    const detail = axiosErr.response?.data?.detail || "";

    if (isDatabaseConnectionError(detail)) {
      // SQLAlchemy/PyMySQL error - show mapped user-friendly message
      toast.error(getDbErrorMessage(detail, t));
    } else if (detail) {
      // HTTPException from backend - show message directly
      toast.error(detail);
    } else {
      // Fallback for unknown errors
      toast.error(t(fallbackKey));
    }
  } else {
    toast.error(t(fallbackKey));
  }
}
