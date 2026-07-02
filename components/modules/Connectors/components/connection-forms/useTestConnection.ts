import { useState } from "react";
import { encryptForServer } from "@/lib/services/ecdhService";
import type { SSLConfig } from "../security/SSLSettings";

export type TestStatus = "idle" | "testing" | "success" | "failed";

export type TestWarning = Readonly<{
  layer: number;
  message: string;
  hint?: string;
}>;

type Options = Readonly<{
  /** Resolve the URL to validate. Return null to abort. Throw to set failed state. */
  getUrl: () => Promise<string | null>;
  /** Return current SSL config if enabled, or undefined. */
  getSslConfig?: () => SSLConfig | undefined;
  token: string | null | undefined;
  defaultError: string;
  networkError: string;
}>;

type Return = Readonly<{
  testStatus: TestStatus;
  testError: string | null;
  testHint: string | null;
  testDetailsOpen: boolean;
  setTestDetailsOpen: (open: boolean) => void;
  testWarnings: TestWarning[];
  handleTestConnection: () => Promise<void>;
}>;

export const useTestConnection = ({
  getUrl,
  getSslConfig,
  token,
  defaultError,
  networkError,
}: Options): Return => {
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [testHint, setTestHint] = useState<string | null>(null);
  const [testDetailsOpen, setTestDetailsOpen] = useState(false);
  const [testWarnings, setTestWarnings] = useState<TestWarning[]>([]);

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError(null);
    setTestHint(null);
    setTestDetailsOpen(false);
    setTestWarnings([]);

    let url: string;

    try {
      const resolved = await getUrl();

      if (resolved === null) {
        setTestStatus("idle");
        return;
      }

      url = resolved;
    } catch (e) {
      setTestStatus("failed");
      setTestError(e instanceof Error ? e.message : defaultError);
      return;
    }

    try {
      const encryptedConnectionString = await encryptForServer(url);

      const payload: Record<string, unknown> = {
        connection_string: encryptedConnectionString,
      };

      const ssl = getSslConfig?.();

      if (ssl?.enabled) {
        payload.ssl_config = {
          mode: ssl.mode,
          ...(ssl.caPem ? { ca_cert: ssl.caPem } : {}),
          ...(ssl.certPem ? { cert: ssl.certPem } : {}),
        };
      }

      const res = await fetch("/api/connectors/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        hint?: string;
        warnings?: TestWarning[];
      };

      if (res.ok) {
        setTestStatus("success");
        if (body.warnings?.length) setTestWarnings(body.warnings);
      } else {
        setTestStatus("failed");
        setTestError(body.error ?? body.message ?? defaultError);
        if (body.hint) setTestHint(body.hint);
      }
    } catch {
      setTestStatus("failed");
      setTestError(networkError);
    }
  };

  return {
    testStatus,
    testError,
    testHint,
    testDetailsOpen,
    setTestDetailsOpen,
    testWarnings,
    handleTestConnection,
  };
};
